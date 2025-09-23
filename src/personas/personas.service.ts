import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import { Persona } from './entities/persona.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class PersonasService {
  constructor(
    @InjectRepository(Persona)
    private personaRepo: Repository<Persona>,
  ) {}

  /**
   * Valida si una cédula ecuatoriana es válida
   */
  private validarCedula(cedula: string): boolean {
    if (!/^\d{10}$/.test(cedula)) return false; // Debe tener 10 dígitos
    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) return false; // Provincia válida (01-24)

    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;

    for (let i = 0; i < 9; i++) {
      let valor = parseInt(cedula[i]) * coeficientes[i];
      if (valor >= 10) valor -= 9;
      suma += valor;
    }

    const digitoVerificador = (10 - (suma % 10)) % 10;
    return digitoVerificador === parseInt(cedula[9]);
  }

  /**
   * Valida si un RUC ecuatoriano es válido
   */
  private validarRuc(ruc: string): boolean {
    if (!/^\d{13}$/.test(ruc)) return false; // Debe tener 13 dígitos
    if (!ruc.endsWith('001')) return false; // Debe terminar en 001
    return this.validarCedula(ruc.substring(0, 10)); // Los primeros 10 dígitos deben ser una cédula válida
  }

  /**
   * Valida el formato de un correo electrónico
   */
  private validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Crea una nueva persona en la base de datos
   */
  async create(createPersonaDto: CreatePersonaDto) {
    try {
      // Validar cédula o RUC
      if (
        !createPersonaDto.cedula ||
        !this.validarCedula(createPersonaDto.cedula)
      ) {
        throw new BadRequestException('Cédula inválida');
      }
      if (
        createPersonaDto.cedula === 'RUC' &&
        !this.validarRuc(createPersonaDto.cedula)
      ) {
        throw new BadRequestException('RUC inválido');
      }
      // Verificar si ya existe una persona con la misma cédula
      const existingPersona = await this.personaRepo.findOne({
        where: { cedula: createPersonaDto.cedula },
      });
      if (existingPersona) {
        throw new ConflictException('Ya existe una persona con esta cédula');
      }
      // Validar email
      if (
        createPersonaDto.correo &&
        !this.validarEmail(createPersonaDto.correo)
      ) {
        throw new BadRequestException('Correo electrónico inválido');
      }

      // Verificar si ya existe una persona con el mismo correo
      if (createPersonaDto.correo) {
        const existingCorreo = await this.personaRepo.findOne({
          where: { correo: createPersonaDto.correo },
        });
        if (existingCorreo) {
          throw new ConflictException('Ya existe una persona con este correo');
        }
      }

      // Validaciones según si es fallecido o no
      if (createPersonaDto.fallecido) {
        // Si es fallecido, los siguientes campos son obligatorios
        if (
          !createPersonaDto.fecha_defuncion ||
          !createPersonaDto.fecha_nacimiento ||
          !createPersonaDto.lugar_defuncion ||
          !createPersonaDto.causa_defuncion ||
          !createPersonaDto.nacionalidad
        ) {
          throw new BadRequestException(
            'Para personas fallecidas, debe proporcionar fecha de defunción, fecha de nacimiento, lugar de defunción y causa de defunción, fecha de inhumación y nacionalidad',
          );
        }
        // Validar fechas
        if (new Date(createPersonaDto.fecha_nacimiento) >= new Date()) {
          throw new BadRequestException(
            'La fecha de nacimiento no puede ser futura',
          );
        }
        const fechaNacimiento = new Date(createPersonaDto.fecha_nacimiento);
        const fechaDefuncion = new Date(createPersonaDto.fecha_defuncion);
        if (fechaDefuncion < fechaNacimiento) {
          throw new BadRequestException(
            'La fecha de defunción no puede ser anterior a la fecha de nacimiento',
          );
        }

        if (createPersonaDto.fecha_inhumacion) {
          const fechaInhumacion = new Date(createPersonaDto.fecha_inhumacion);

          if (fechaInhumacion < fechaDefuncion) {
            throw new BadRequestException(
              'La fecha de inhumación no puede ser anterior a la fecha de defunción',
            );
          }
        }
      } else {
        // Si NO es fallecido, los siguientes campos son obligatorios
        if (
          !createPersonaDto.direccion ||
          !createPersonaDto.telefono ||
          !createPersonaDto.correo
        ) {
          throw new BadRequestException(
            'Para personas vivas, debe proporcionar dirección, teléfono y correo',
          );
        }
        if (!this.validarEmail(createPersonaDto.correo)) {
          throw new BadRequestException('Correo electrónico inválido');
        }
      }

      // Crear y guardar la nueva persona
      const persona = this.personaRepo.create(createPersonaDto);
      return await this.personaRepo.save(persona);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al crear la persona: ' + (error.message || error));
    }
  }

  /**
   * Obtiene todas las personas de la base de datos
   */
  findAll(): Promise<Persona[]> {
    try {
      return this.personaRepo.find();
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener personas: ' + (error.message || error));
    }
  }

  /**
   * Busca una persona por su ID
   */
  async findOne(id: string) {
    try {
      const persona = await this.personaRepo.findOne({
        where: { id_persona: id },
      });
      if (!persona) {
        throw new NotFoundException('Persona not found');
      }
      return persona;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al buscar la persona: ' + (error.message || error));
    }
  }

  /**
   * Busca personas por cédula, nombres o apellidos con filtro opcional por estado vivo/fallecido
   */
  async findBy(query?: string, vivos?: boolean): Promise<Persona[]> {
    try {
      const queryBuilder = this.personaRepo.createQueryBuilder('persona');

      // Filtro por término de búsqueda
      if (query) {
        const searchTerm = `%${query}%`;
        queryBuilder.where(
          '(persona.cedula ILIKE :searchTerm OR persona.nombres ILIKE :searchTerm OR persona.apellidos ILIKE :searchTerm)',
          { searchTerm },
        );
      }

      // Filtro por estado vivo/fallecido
      if (vivos !== undefined) {
        const fallecido = !vivos; // Si vivos=true, entonces fallecido=false
        if (query) {
          queryBuilder.andWhere('persona.fallecido = :fallecido', {
            fallecido,
          });
        } else {
          queryBuilder.where('persona.fallecido = :fallecido', {
            fallecido,
          });
        }
      }

      return await queryBuilder.getMany();
    } catch (error) {
      throw new InternalServerErrorException('Error al buscar personas: ' + (error.message || error));
    }
  }

  /**
   * Actualiza los datos de una persona por su ID
   */
  async update(id: string, dto: UpdatePersonaDto) {
    try {

      // Validar cédula o RUC
      if (
        !dto.cedula ||
        !this.validarCedula(dto.cedula)
      ) {
        throw new BadRequestException('Cédula inválida');
      }

      const duplicatedCedula = await this.personaRepo.findOne({
        where: { cedula: dto.cedula },
      });

      if (duplicatedCedula && duplicatedCedula.id_persona !== id) {
        throw new ConflictException('Ya existe una persona con esta cédula');
      }


      const persona = await this.personaRepo.findOne({
        where: { id_persona: id },
      });
      if (!persona) {
        throw new NotFoundException('Persona not found');
      }

      // No permitir cambiar de fallecido:true a fallecido:false
      if (persona.fallecido === true && dto.fallecido === false) {
        throw new BadRequestException('No se puede cambiar una persona fallecida a viva');
      }

      // Validaciones si se actualiza a fallecido
      if (dto.fallecido) {
        if (
          !dto.fecha_defuncion ||
          !dto.fecha_nacimiento ||
          !dto.lugar_defuncion ||
          !dto.causa_defuncion
        ) {
          throw new BadRequestException(
            'Para personas fallecidas, debe proporcionar fecha de defunción, fecha de nacimiento, lugar de defunción, causa de defunción y fecha de inhumación',
          );
        }
        if (new Date(dto.fecha_nacimiento) >= new Date()) {
          throw new BadRequestException(
            'La fecha de nacimiento no puede ser futura',
          );
        }
        const fechaNacimiento = new Date(dto.fecha_nacimiento);
        const fechaDefuncion = new Date(dto.fecha_defuncion);
        if (fechaDefuncion < fechaNacimiento) {
          throw new BadRequestException(
            'La fecha de defunción no puede ser anterior a la fecha de nacimiento',
          );
        }
        if (dto.fecha_inhumacion) {
          const fechaInhumacion = new Date(dto.fecha_inhumacion);
          if (fechaInhumacion < fechaDefuncion) {
            throw new BadRequestException(
              'La fecha de inhumación no puede ser anterior a la fecha de defunción',
            );
          }
        }
      } else {
        // Si NO es fallecido, los siguientes campos son obligatorios
        if (
          (dto.direccion !== undefined && !dto.direccion) ||
          (dto.telefono !== undefined && !dto.telefono) ||
          (dto.correo !== undefined && !dto.correo)
        ) {
          throw new BadRequestException(
            'Para personas vivas, debe proporcionar dirección, teléfono y correo',
          );
        }
        if (dto.correo && !this.validarEmail(dto.correo)) {
          throw new BadRequestException('Correo electrónico inválido');
        }
      }

      // Actualizar y guardar la persona
      this.personaRepo.merge(persona, dto);
      return await this.personaRepo.save(persona);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Error al actualizar la persona: ' + (error.message || error));
    }
  }

  /**
   * Elimina una persona por su ID
   */
  async remove(id: string) {
    try {
      const persona = await this.personaRepo.findOne({
        where: { id_persona: id },
      });
      if (!persona) {
        throw new NotFoundException('Persona not found');
      }
      return await this.personaRepo.remove(persona);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al eliminar la persona: ' + (error.message || error));
    }
  }
}
