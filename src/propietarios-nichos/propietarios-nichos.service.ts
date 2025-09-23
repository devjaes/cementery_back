import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePropietarioNichoDto } from './dto/create-propietarios-nicho.dto';
import { UpdatePropietarioNichoDto } from './dto/update-propietarios-nicho.dto';
import { PropietarioNicho } from './entities/propietarios-nicho.entity';
import { Nicho } from 'src/nicho/entities/nicho.entity';
import { Persona } from 'src/personas/entities/persona.entity';

@Injectable()
export class PropietariosNichosService {
  constructor(
    @InjectRepository(PropietarioNicho)
    private propietarioRepo: Repository<PropietarioNicho>,
    @InjectRepository(Nicho)
    private nichoRepo: Repository<Nicho>,
    @InjectRepository(Persona)
    private personaRepo: Repository<Persona>,
  ) {}

  /**
   * Crea un nuevo propietario de nicho
   */
  async create(dto: CreatePropietarioNichoDto) {
    try {
      // Normalizar si llegan como string
      if (typeof dto.id_persona === 'string') {
        dto.id_persona = { id_persona: dto.id_persona };
      }
      if (typeof dto.id_nicho === 'string') {
        dto.id_nicho = { id_nicho: dto.id_nicho };
      }

      // Validar que el nicho exista
      const nicho = await this.nichoRepo.findOne({
        where: { id_nicho: dto.id_nicho.id_nicho },
        relations: ['propietarios_nicho'],
      });
      if (!nicho) {
        throw new NotFoundException(
          `Nicho with id ${dto.id_nicho.id_nicho} not found`,
        );
      }

      // Validar que la persona exista
      const persona = await this.personaRepo.findOne({
        where: { id_persona: dto.id_persona.id_persona },
      });
      if (!persona) {
        throw new NotFoundException(
          `Persona with id ${dto.id_persona.id_persona} not found`,
        );
      }
      // No permitir asignar propietario a fallecido
      if (persona.fallecido == true) {
        throw new InternalServerErrorException(
          `No se puede asignar un propietario a un fallecido`,
        );
      }

      // Verificar si ya existe un propietario activo para el nicho y persona
      const existingPropietario = await this.propietarioRepo
        .createQueryBuilder('propietario')
        .leftJoin('propietario.id_nicho', 'nicho')
        .where('nicho.id_nicho = :idNicho', { idNicho: nicho.id_nicho })
        .andWhere('propietario.id_persona = :idPersona', {idPersona: persona.id_persona,})
        .andWhere('propietario.activo = :activo', { activo: true })
        .getOne();

      if (existingPropietario) {
        throw new InternalServerErrorException(
          `Este usuario ya es propietario de este nicho`,
        );
      }

      // Si el tipo es Heredero o Dueño, desactiva el propietario anterior activo del nicho
      if (dto.tipo == 'Heredero' || dto.tipo == 'Dueño') {
        const propietario = await this.propietarioRepo
          .createQueryBuilder('propietario')
          .leftJoin('propietario.id_nicho', 'nicho')
          .where('nicho.id_nicho = :idNicho', { idNicho: nicho.id_nicho })
          .andWhere('propietario.activo = :activo', { activo: true })
          .getOne();

        if (propietario) {
          propietario.activo = false;
          await this.propietarioRepo.save(propietario);
        }
      }
      // Crear y guardar el nuevo propietario
      const propietario = this.propietarioRepo.create(dto);
      return await this.propietarioRepo.save(propietario);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al crear el propietario de nicho: ' + (error.message || error));
    }
  }

  /**
   * Obtiene todos los propietarios de nicho activos
   */
  findAll() {
    try {
      return this.propietarioRepo.find({
        where: { activo: true },
        relations: ['id_nicho', 'id_persona'],
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener propietarios de nicho: ' + (error.message || error));
    }
  }

  /**
   * Busca un propietario de nicho por su ID
   */
  async findOne(id: string) {
    try {
      const propietario = await this.propietarioRepo.findOne({
        where: { id_propietario_nicho: id },
        relations: ['id_nicho', 'id_persona'],
      });
      if (!propietario) {
        throw new NotFoundException(`PropietarioNicho with id ${id} not found`);
      }
      return propietario;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al buscar el propietario de nicho: ' + (error.message || error));
    }
  }

  /**
   * Obtiene todos los propietarios activos de un nicho por su ID de nicho
   */
  async findByNicho(idNicho: string) {
    try {
      return await this.propietarioRepo
        .createQueryBuilder('propietario')
        .leftJoinAndSelect('propietario.id_nicho', 'nicho')
        .leftJoinAndSelect('propietario.id_persona', 'persona')
        .where('nicho.id_nicho = :idNicho', { idNicho })
        .andWhere('propietario.activo = :activo', { activo: true })
        .getMany();
    } catch (error) {
      throw new InternalServerErrorException('Error al buscar propietarios por nicho: ' + (error.message || error));
    }
  }

  /**
   * Obtiene el historial de propietarios (activos e inactivos) de un nicho
   */
  async historial(idNicho: string) {
    try {
      return await this.propietarioRepo
        .createQueryBuilder('propietario')
        .leftJoinAndSelect('propietario.id_nicho', 'nicho')
        .leftJoinAndSelect('propietario.id_persona', 'persona')
        .where('nicho.id_nicho = :idNicho', { idNicho })
        .getMany();
    } catch (error) {
      throw new InternalServerErrorException('Error al buscar historial de propietarios por nicho: ' + (error.message || error));
    }
  }

  /**
   * Busca propietarios de nicho por la cédula de la persona
   */
  async findByPersona(cedula: string) {
    try {
      const persona = await this.personaRepo.findOne({
        where: { cedula },
      });
      if (!persona) {
        throw new NotFoundException(`Persona with cedula ${cedula} not found`);
      }

      const propietarios = await this.propietarioRepo
        .createQueryBuilder('propietario')
        .leftJoinAndSelect('propietario.id_nicho', 'nicho')
        .leftJoinAndSelect('propietario.id_persona', 'persona')
        .where('persona.id_persona = :idPersona', { idPersona: persona.id_persona })
        .getMany();

      if (!propietarios || propietarios.length === 0) {
        throw new NotFoundException(
          `No propietarios found for persona with cedula ${cedula}`,
        );
      }
      return propietarios;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al buscar propietarios por persona: ' + (error.message || error));
    }
  }

  /**
   * Actualiza un propietario de nicho por su ID
   */
  async update(id: string, dto: UpdatePropietarioNichoDto) {
    try {
      const propietario = await this.propietarioRepo.findOne({
        where: { id_propietario_nicho: id },
      });
      if (!propietario) {
        throw new NotFoundException(`PropietarioNicho with id ${id} not found`);
      }
      this.propietarioRepo.merge(propietario, dto);
      return await this.propietarioRepo.save(propietario);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al actualizar el propietario de nicho: ' + (error.message || error));
    }
  }

  /**
   * Elimina (borra) un propietario de nicho por su ID
   */
  async remove(id: string) {
    try {
      const propietario = await this.propietarioRepo.findOne({
        where: { id_propietario_nicho: id },
      });
      if (!propietario) {
        throw new NotFoundException(`PropietarioNicho with id ${id} not found`);
      }
      return await this.propietarioRepo.delete(id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al eliminar el propietario de nicho: ' + (error.message || error));
    }
  }
}
