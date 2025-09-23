import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { CreateCementerioDto } from './dto/create-cementerio.dto';
import { UpdateCementerioDto } from './dto/update-cementerio.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Cementerio } from './entities/cementerio.entity';
import { Like, Repository } from 'typeorm';

@Injectable()
export class CementerioService {
  constructor(@InjectRepository(Cementerio) private readonly cementerioRepository: Repository<Cementerio>) {
    console.log('CementerioService initialized');
  }

  /**
   * Crea un nuevo cementerio en la base de datos
   */
  async create(createCementerioDto: CreateCementerioDto) {
    try {
      // Verifica si ya existe un cementerio con el mismo nombre
      const existente = await this.cementerioRepository.findOne({
        where: { nombre: createCementerioDto.nombre },
      });
      if (existente) {
        throw new InternalServerErrorException('Ya existe un cementerio con ese nombre');
      }
      // Crea y guarda el cementerio
      const cementerio = this.cementerioRepository.create(createCementerioDto);
      const savedCementerio = await this.cementerioRepository.save(cementerio);
      return { cementerio: savedCementerio };
    } catch (error) {
      throw new InternalServerErrorException('Error al crear el cementerio: ' + (error.message || error));
    }
  }

  /**
   * Obtiene todos los cementerios
   */
  async findAll() {
    try {
      const cementerios = await this.cementerioRepository.find();
      return cementerios.map(cementerio => ({ ...cementerio }));
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener los cementerios: ' + (error.message || error));
    }
  }

  /**
   * Busca un cementerio por su ID
   */
  async findOne(id: string) {
    try {
      const cementerio = await this.cementerioRepository.findOne({ where: { id_cementerio: id } });
      if (!cementerio) {
        throw new NotFoundException('No se encontro el cementerio');
      }
      return { ...cementerio };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al buscar el cementerio: ' + (error.message || error));
    }
  }

  /**
   * Actualiza los datos de un cementerio por su ID
   */
  async update(id: string, updateCementerioDto: UpdateCementerioDto) {
    try {
      // Verifica si ya existe otro cementerio con el mismo nombre
      const existente = await this.cementerioRepository.findOne({
        where: { nombre: updateCementerioDto.nombre },
      });
      if (existente && existente.id_cementerio !== id) {
        throw new InternalServerErrorException('Ya existe un cementerio con ese nombre');
      }
      // Busca el cementerio a actualizar
      const cementerio = await this.cementerioRepository.findOne({ where: { id_cementerio: id } });
      if (!cementerio) {
        throw new NotFoundException('No se encontro el cementerio');
      }
      // Actualiza y guarda los cambios
      this.cementerioRepository.merge(cementerio, updateCementerioDto);
      const savedCementerio = await this.cementerioRepository.save(cementerio);
      return { cementerio: savedCementerio };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al actualizar el cementerio: ' + (error.message || error));
    }
  }

  /**
   * Elimina un cementerio por su ID
   */
  async remove(id: string) {
    try {
      // Busca el cementerio a eliminar con sus nichos asociados
      const cementerio = await this.cementerioRepository.findOne({ 
        where: { id_cementerio: id },
        relations: ['nichos']
      });
      
      if (!cementerio) {
        throw new NotFoundException('No se encontro el cementerio');
      }

      // Verifica si el cementerio tiene nichos asociados
      if (cementerio.nichos && cementerio.nichos.length > 0) {
        throw new BadRequestException(
          `No se puede eliminar el cementerio "${cementerio.nombre}" porque tiene ${cementerio.nichos.length} nicho(s) asociado(s). Primero debe eliminar o reubicar los nichos.`
        );
      }

      // Elimina el cementerio solo si no tiene nichos asociados
      await this.cementerioRepository.remove(cementerio);
      return { deleted: true, id, mensaje: `Cementerio "${cementerio.nombre}" eliminado exitosamente` };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Error al eliminar el cementerio: ' + (error.message || error));
    }
  }

  /**
   * Busca un cementerio por nombre (búsqueda parcial)
   */
  async findByName(name: string) {
    try {
      const cementerio = await this.cementerioRepository.findOne({ where: { nombre: Like(`%${name}%`) } });
      if (!cementerio) {
        throw new NotFoundException('No se encontro el cementerio');
      }
      return { cementerio };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al buscar el cementerio: ' + (error.message || error));
    }
  }
}
