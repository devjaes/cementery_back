import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { CreateCementerioDto } from './dto/create-cementerio.dto';
import { UpdateCementerioDto } from './dto/update-cementerio.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Cementerio } from './entities/cementerio.entity';
import { Bloque } from 'src/bloques/entities/bloque.entity';
import { Like, Repository } from 'typeorm';

@Injectable()
export class CementerioService {
  constructor(
    @InjectRepository(Cementerio)
    private readonly cementerioRepository: Repository<Cementerio>,
    @InjectRepository(Bloque)
    private readonly bloqueRepository: Repository<Bloque>,
  ) {
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
        throw new BadRequestException(
          'Ya existe un cementerio con ese nombre',
        );
      }

      // Separar los datos del cementerio de los bloques
      const { bloques, ...cementerioData } = createCementerioDto;

      // Crea y guarda el cementerio
      const cementerio = this.cementerioRepository.create(cementerioData);
      const savedCementerio = await this.cementerioRepository.save(cementerio);

      // Si se proporcionaron bloques, crearlos
      if (bloques && bloques.length > 0) {
        for (const bloqueData of bloques) {
          try {
            // Verificar si ya existe un bloque con ese nombre en el cementerio
            const existenteBloque = await this.bloqueRepository.findOne({
              where: { 
                nombre: bloqueData.nombre,
                id_cementerio: savedCementerio.id_cementerio,
              },
            });
            if (existenteBloque) {
              console.warn(`Bloque "${bloqueData.nombre}" ya existe, omitiendo...`);
              continue;
            }

            // Crear el bloque asignando explícitamente todos los campos
            const nuevoBloque = new Bloque();
            nuevoBloque.nombre = bloqueData.nombre;
            nuevoBloque.descripcion = bloqueData.descripcion;
            nuevoBloque.numero_filas = bloqueData.numero_filas;
            nuevoBloque.numero_columnas = bloqueData.numero_columnas;
            nuevoBloque.id_cementerio = savedCementerio.id_cementerio;
            nuevoBloque.estado = 'Activo';
            nuevoBloque.fecha_creacion = new Date().toISOString();
            
            await this.bloqueRepository.save(nuevoBloque);
          } catch (bloqueError) {
            console.error(`Error al crear bloque "${bloqueData.nombre}":`, bloqueError);
            throw bloqueError;
          }
        }
      }

      // Obtener el cementerio con sus bloques para devolverlo
      const cementerioConBloques = await this.cementerioRepository.findOne({
        where: { id_cementerio: savedCementerio.id_cementerio },
        relations: ['bloques'],
      });

      return { 
        success: true,
        message: 'Cementerio creado exitosamente',
        data: cementerioConBloques 
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al crear el cementerio: ' + (error.message || error),
      );
    }
  }

  /**
   * Obtiene todos los cementerios
   */
  async findAll() {
    try {
      const cementerios = await this.cementerioRepository.find();
      return cementerios.map((cementerio) => ({ ...cementerio }));
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al obtener los cementerios: ' + (error.message || error),
      );
    }
  }

  /**
   * Busca un cementerio por su ID
   */
  async findOne(id: string) {
    try {
      const cementerio = await this.cementerioRepository.findOne({
        where: { id_cementerio: id },
      });
      if (!cementerio) {
        throw new NotFoundException('No se encontro el cementerio');
      }
      return { ...cementerio };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Error al buscar el cementerio: ' + (error.message || error),
      );
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
        throw new InternalServerErrorException(
          'Ya existe un cementerio con ese nombre',
        );
      }
      // Busca el cementerio a actualizar
      const cementerio = await this.cementerioRepository.findOne({
        where: { id_cementerio: id },
      });
      if (!cementerio) {
        throw new NotFoundException('No se encontro el cementerio');
      }
      // Actualiza y guarda los cambios
      this.cementerioRepository.merge(cementerio, updateCementerioDto);
      const savedCementerio = await this.cementerioRepository.save(cementerio);
      return { cementerio: savedCementerio };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Error al actualizar el cementerio: ' + (error.message || error),
      );
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
        relations: ['nichos'],
      });

      if (!cementerio) {
        throw new NotFoundException('No se encontro el cementerio');
      }

      // Verifica si el cementerio tiene nichos asociados
      if (cementerio.nichos && cementerio.nichos.length > 0) {
        throw new BadRequestException(
          `No se puede eliminar el cementerio "${cementerio.nombre}" porque tiene ${cementerio.nichos.length} nicho(s) asociado(s). Primero debe eliminar o reubicar los nichos.`,
        );
      }

      // Elimina el cementerio solo si no tiene nichos asociados
      await this.cementerioRepository.remove(cementerio);
      return {
        deleted: true,
        id,
        mensaje: `Cementerio "${cementerio.nombre}" eliminado exitosamente`,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException(
        'Error al eliminar el cementerio: ' + (error.message || error),
      );
    }
  }

  /**
   * Busca un cementerio por nombre (búsqueda parcial)
   */
  async findByName(name: string) {
    try {
      const cementerio = await this.cementerioRepository.findOne({
        where: { nombre: Like(`%${name}%`) },
      });
      if (!cementerio) {
        throw new NotFoundException('No se encontro el cementerio');
      }
      return { cementerio };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Error al buscar el cementerio: ' + (error.message || error),
      );
    }
  }
}
