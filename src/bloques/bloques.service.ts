import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { CreateBloqueDto } from './dto/create-bloque.dto';
import { UpdateBloqueDto } from './dto/update-bloque.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Bloque } from './entities/bloque.entity';
import { Cementerio } from 'src/cementerio/entities/cementerio.entity';
import { Like, Repository, Not } from 'typeorm';

@Injectable()
export class BloquesService {
  constructor(
    @InjectRepository(Bloque)
    private readonly bloqueRepository: Repository<Bloque>,
    @InjectRepository(Cementerio)
    private readonly cementerioRepository: Repository<Cementerio>,
  ) {
    console.log('BloquesService initialized');
  }

  /**
   * Crea un nuevo bloque en la base de datos
   */
  async create(createBloqueDto: CreateBloqueDto) {
    try {
      // Verifica si el cementerio existe
      const cementerio = await this.cementerioRepository.findOne({
        where: { id_cementerio: createBloqueDto.id_cementerio },
      });
      if (!cementerio) {
        throw new NotFoundException('Cementerio no encontrado');
      }

      // Verifica si ya existe un bloque con el mismo nombre en el cementerio (solo activos)
      const existente = await this.bloqueRepository.findOne({
        where: { 
          nombre: createBloqueDto.nombre,
          id_cementerio: { id_cementerio: createBloqueDto.id_cementerio },
          estado: Not('Inactivo'), // Solo verificar contra bloques activos
        },
      });
      if (existente) {
        throw new BadRequestException(
          'Ya existe un bloque activo con ese nombre en el cementerio',
        );
      }

      // Crea y guarda el bloque
      const bloque = this.bloqueRepository.create({
        ...createBloqueDto,
        id_cementerio: cementerio,
      });
      const savedBloque = await this.bloqueRepository.save(bloque);
      return { bloque: savedBloque };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al crear el bloque: ' + (error.message || error),
      );
    }
  }

  /**
   * Obtiene todos los bloques activos
   */
  async findAll() {
    try {
      const bloques = await this.bloqueRepository.find({
        where: { estado: Not('Inactivo') }, // Solo bloques activos
        relations: ['id_cementerio'],
      });
      return { bloques };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al obtener los bloques: ' + (error.message || error),
      );
    }
  }

  /**
   * Obtiene bloques activos por ID de cementerio
   */
  async findByCementerio(id_cementerio: string) {
    try {
      const bloques = await this.bloqueRepository.find({
        where: { 
          id_cementerio: { id_cementerio },
          estado: Not('Inactivo'), // Solo bloques activos
        },
        relations: ['id_cementerio'],
      });
      return { bloques };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al obtener los bloques del cementerio: ' + (error.message || error),
      );
    }
  }

  /**
   * Obtiene un bloque por ID (solo si está activo)
   */
  async findOne(id: string) {
    try {
      const bloque = await this.bloqueRepository.findOne({
        where: { 
          id_bloque: id,
          estado: Not('Inactivo'), // Solo bloques activos
        },
        relations: ['id_cementerio', 'nichos'],
      });
      if (!bloque) {
        throw new NotFoundException('Bloque no encontrado o inactivo');
      }
      return { bloque };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al obtener el bloque: ' + (error.message || error),
      );
    }
  }

  /**
   * Actualiza un bloque (solo si está activo)
   */
  async update(id: string, updateBloqueDto: UpdateBloqueDto) {
    try {
      const bloque = await this.bloqueRepository.findOne({
        where: { 
          id_bloque: id,
          estado: Not('Inactivo'), // Solo actualizar bloques activos
        },
        relations: ['id_cementerio'],
      });
      if (!bloque) {
        throw new NotFoundException('Bloque no encontrado o inactivo');
      }

      let cementerio = bloque.id_cementerio;
      
      // Si se está actualizando el cementerio, verificar que exista
      if (updateBloqueDto.id_cementerio) {
        const nuevoCementerio = await this.cementerioRepository.findOne({
          where: { id_cementerio: updateBloqueDto.id_cementerio },
        });
        if (!nuevoCementerio) {
          throw new NotFoundException('Cementerio no encontrado');
        }
        cementerio = nuevoCementerio;
      }

      // Verifica si hay conflicto de nombres en el mismo cementerio (solo activos)
      if (updateBloqueDto.nombre) {
        const existente = await this.bloqueRepository.findOne({
          where: { 
            nombre: updateBloqueDto.nombre,
            id_cementerio: { 
              id_cementerio: cementerio.id_cementerio 
            },
            estado: Not('Inactivo'), // Solo verificar contra bloques activos
          },
        });
        if (existente && existente.id_bloque !== id) {
          throw new BadRequestException(
            'Ya existe un bloque activo con ese nombre en el cementerio',
          );
        }
      }

      // Preparar datos de actualización
      const updateData: any = {
        ...updateBloqueDto,
      };
      
      // Si se cambió el cementerio, establecer la relación
      if (updateBloqueDto.id_cementerio) {
        updateData.id_cementerio = cementerio;
        delete updateData.id_cementerio; // No incluir el string ID en la actualización
      }

      // Actualizar solo los campos que no sean relaciones
      const { id_cementerio: _, ...fieldsToUpdate } = updateBloqueDto;
      await this.bloqueRepository.update(id, fieldsToUpdate);
      
      // Si se cambió el cementerio, actualizarlo por separado
      if (updateBloqueDto.id_cementerio) {
        bloque.id_cementerio = cementerio;
        await this.bloqueRepository.save(bloque);
      }

      const updatedBloque = await this.bloqueRepository.findOne({
        where: { id_bloque: id },
        relations: ['id_cementerio'],
      });
      return { bloque: updatedBloque };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al actualizar el bloque: ' + (error.message || error),
      );
    }
  }

  /**
   * Elimina un bloque (soft delete)
   */
  async remove(id: string) {
    try {
      const bloque = await this.bloqueRepository.findOne({
        where: { 
          id_bloque: id,
          estado: Not('Inactivo'), // Solo eliminar bloques activos
        },
        relations: ['nichos'],
      });
      if (!bloque) {
        throw new NotFoundException('Bloque no encontrado o ya está inactivo');
      }

      // Verificar si el bloque tiene nichos asociados
      if (bloque.nichos && bloque.nichos.length > 0) {
        const nichosActivos = bloque.nichos.filter(n => n.estado !== 'Inactivo');
        if (nichosActivos.length > 0) {
          throw new BadRequestException(
            `No se puede eliminar el bloque porque tiene ${nichosActivos.length} nicho(s) activo(s) asociado(s)`,
          );
        }
      }

      // Soft delete: cambiar estado a inactivo
      await this.bloqueRepository.update(id, { estado: 'Inactivo' });
      return { message: 'Bloque eliminado correctamente' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al eliminar el bloque: ' + (error.message || error),
      );
    }
  }

  /**
   * Busca bloques por nombre
   */
  async search(nombre: string) {
    try {
      const bloques = await this.bloqueRepository.find({
        where: { 
          nombre: Like(`%${nombre}%`),
          estado: Not('Inactivo'), // Solo buscar bloques activos
        },
        relations: ['id_cementerio'],
      });
      return { bloques };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al buscar bloques: ' + (error.message || error),
      );
    }
  }
}