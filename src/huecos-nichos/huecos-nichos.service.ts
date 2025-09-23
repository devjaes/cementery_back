import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { CreateHuecosNichoDto } from './dto/create-huecos-nicho.dto';
import { UpdateHuecosNichoDto } from './dto/update-huecos-nicho.dto';
import { HuecosNicho } from './entities/huecos-nicho.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class HuecosNichosService {
  @InjectRepository(HuecosNicho)
  private readonly huecoRepository: Repository<HuecosNicho>
  constructor() { }

  /**
   * Crea un nuevo hueco para un nicho
   */
  async create(createHuecosNichoDto: CreateHuecosNichoDto) {
    try {
      // Normalizar id_nicho si llega como string
      if (typeof createHuecosNichoDto.id_nicho === 'string') {
        createHuecosNichoDto.id_nicho = { id_nicho: createHuecosNichoDto.id_nicho };
      }

      // Normalizar id_fallecido si llega como string (opcional)
      if (createHuecosNichoDto.id_fallecido && typeof createHuecosNichoDto.id_fallecido === 'string') {
        createHuecosNichoDto.id_fallecido = { id_persona: createHuecosNichoDto.id_fallecido };
      }

      // Obtener el número de huecos existentes para el nicho y asignar el siguiente número
      const count = await this.huecoRepository
        .createQueryBuilder('hueco')
        .where('hueco.id_nicho = :id_nicho', { id_nicho: createHuecosNichoDto.id_nicho.id_nicho })
        .getCount();
      createHuecosNichoDto.num_hueco = count + 1;

      // Crear y guardar el hueco
      const hueco = this.huecoRepository.create(createHuecosNichoDto);
      const savedHueco = await this.huecoRepository.save(hueco);

      // Actualizar el número de huecos en el nicho
      const nichoRepo = this.huecoRepository.manager.getRepository('Nicho');
      const nicho = await nichoRepo
        .createQueryBuilder('nicho')
        .where('nicho.id_nicho = :id_nicho', { id_nicho: createHuecosNichoDto.id_nicho.id_nicho })
        .getOne();
      if (nicho) {
        nicho.num_huecos = count + 1;
        await nichoRepo.save(nicho);
      }

      return {
        hueco: savedHueco,
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al crear el hueco del nicho: ' + (error.message || error));
    }
  }

  /**
   * Obtiene todos los huecos con sus relaciones principales
   */
  findAll() {
    try {
      return this.huecoRepository.find({
        relations: ['id_nicho', 'id_fallecido'],
      }).then(huecos =>
        huecos.map(h => ({
          ...h,
          nicho: h.id_nicho,
          fallecido: h.id_fallecido,
        }))
      );
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener los huecos del nicho: ' + (error.message || error));
    }
  }

  /**
   * Obtiene todos los huecos disponibles (estado = 'Disponible')
   */
  async findAllDisponibles() {
    try {
      const huecos = await this.huecoRepository.find({
        where: { estado: 'Disponible' },
        relations: ['id_nicho', 'id_fallecido'],
      });
      return huecos.map(h => ({
        ...h,
        nicho: h.id_nicho,
        fallecido: h.id_fallecido,
      }));
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener los huecos disponibles del nicho: ' + (error.message || error));
    }
  }

  /**
   * Busca un hueco por su ID y retorna sus relaciones principales
   */
  async findOne(id: string) {
    try {
      const hueco = await this.huecoRepository.findOne({ where: { id_detalle_hueco: id }, relations: ['id_nicho', 'id_fallecido'] });
      if (!hueco) {
        throw new NotFoundException(`Hueco con ID ${id} no encontrado`);
      }
      return {
        hueco: {
          ...hueco,
          id_nicho: undefined,
          id_fallecido: undefined,
        },
        nicho: hueco.id_nicho,
        fallecido: hueco.id_fallecido,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al buscar el hueco del nicho: ' + (error.message || error));
    }
  }

  /**
   * Obtiene todos los huecos de un nicho por su ID de nicho
   */
  async findByNicho(id_nicho: string) {
    try {
      const huecos = await this.huecoRepository
        .createQueryBuilder('hueco')
        .leftJoinAndSelect('hueco.id_nicho', 'nicho')
        .leftJoinAndSelect('hueco.id_fallecido', 'fallecido')
        .where('nicho.id_nicho = :id_nicho', { id_nicho })
        .getMany();
      return huecos.map(h => ({
        hueco: {
          ...h,
        },
        nicho: h.id_nicho,
        fallecido: h.id_fallecido,
      }));
    } catch (error) {
      throw new InternalServerErrorException('Error al buscar los huecos por nicho: ' + (error.message || error));
    }
  }

  /**
   * Actualiza los datos de un hueco por su ID
   */
  async update(id: string, updateDto: UpdateHuecosNichoDto) {
    try {
      const hueco = await this.findOne(id);
      Object.assign(hueco.hueco, updateDto);
      const savedHueco = await this.huecoRepository.save(hueco.hueco);
      return {
        hueco: savedHueco,
        nicho: hueco.nicho,
        fallecido: hueco.fallecido,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al actualizar el hueco del nicho: ' + (error.message || error));
    }
  }

  /**
   * Elimina un hueco por su ID
   */
  async remove(id: string) {
    try {
      const result = await this.huecoRepository.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`Hueco con ID ${id} no encontrado`);
      }
      return { deleted: true, id };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al eliminar el hueco del nicho: ' + (error.message || error));
    }
  }

  async findAllDisponiblesByCementerio(id_cementerio: string) {
    try {
      const huecos = await this.huecoRepository
        .createQueryBuilder('hueco')
        .leftJoinAndSelect('hueco.id_nicho', 'nicho')
        .where('nicho.id_cementerio = :id_cementerio', { id_cementerio })
        .getMany();
      return huecos.map(h => ({
        ...h,
        nicho: h.id_nicho,
      }));
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener los huecos disponibles por cementerio: ' + (error.message || error));
    }
  }
}
