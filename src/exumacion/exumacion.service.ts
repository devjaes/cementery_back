// src/exhumacion/exhumacion.service.ts
import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exumacion } from './entities/exumacion.entity';
import { CreateExumacionDto } from './dto/create-exumacion.dto';
import { UpdateExumacionDto } from './dto/update-exumacion.dto';
import { Nicho } from 'src/nicho/entities/nicho.entity';

@Injectable()
export class ExumacionService {
  constructor(
    @InjectRepository(Exumacion)
    private readonly exumacionRepository: Repository<Exumacion>,
    @InjectRepository(Nicho)
    private readonly nichoRepository: Repository<Nicho>,
  ) {}

  /**
   * Crea una nueva exhumación
   */
  async create(createExumacionDto: CreateExumacionDto) {
    try {
      // Buscar el nicho original por su ID
      const nichoOriginal = await this.nichoRepository.findOne({
        where: { id_nicho: createExumacionDto.nicho_original_id.id_nicho },
      });

      // Lanzar error si el nicho original no existe
      if (!nichoOriginal) {
        throw new NotFoundException('Nicho original no encontrado');
      }

      // Generar un código único para la exhumación
      const codigo = this.generarCodigoExumacion();

      // Crear la entidad de exhumación con los datos y el código generado
      const exumacion = this.exumacionRepository.create({
        ...createExumacionDto,
        codigo,
        nichoOriginal,
      });

      // Guardar la exhumación en la base de datos
      return await this.exumacionRepository.save(exumacion);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al crear la exhumación: ' + (error.message || error));
    }
  }

  /**
   * Genera un código único para la exhumación
   */
  private generarCodigoExumacion(): string {
    const now = new Date();
    const year = now.getFullYear();
    const randomNum = Math.floor(100 + Math.random() * 900); // Número aleatorio de 3 dígitos
    return `${randomNum}-${year}-CMC-EXH`;
  }

  /**
   * Obtiene todas las exhumaciones con sus relaciones principales
   */
  async findAll() {
    try {
      return await this.exumacionRepository.find({
        relations: ['id_inhumacion', 'id_nicho'],
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener las exhumaciones: ' + (error.message || error));
    }
  }

  /**
   * Busca una exhumación por su ID
   */
  async findOne(id: string) {
    try {
      const exumacion = await this.exumacionRepository.findOne({
        where: { id_exhumacion: id },
        relations: ['id_inhumacion', 'id_nicho'],
      });

      if (!exumacion) {
        throw new NotFoundException(`Exhumación con ID ${id} no encontrada`);
      }

      return exumacion;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al obtener la exhumación: ' + (error.message || error));
    }
  }

  /**
   * Actualiza una exhumación por su ID
   */
  async update(id: string, updateExumacionDto: UpdateExumacionDto) {
    try {
      const exumacion = await this.findOne(id);
      Object.assign(exumacion, updateExumacionDto);
      return await this.exumacionRepository.save(exumacion);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al actualizar la exhumación: ' + (error.message || error));
    }
  }

  /**
   * Elimina una exhumación por su ID
   */
  async remove(id: string) {
    try {
      const exumacion = await this.findOne(id);
      return await this.exumacionRepository.remove(exumacion);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al eliminar la exhumación: ' + (error.message || error));
    }
  }

  /**
   * Genera un formulario (PDF/HTML) para la exhumación por su ID
   */
  async generarFormularioExumacion(id: string) {
    try {
      const exumacion = await this.findOne(id);
      // Aquí puedes generar el PDF o HTML del formulario basado en la entidad
      return {
        ...exumacion,
        // Puedes agregar formato específico para el formulario
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al generar el formulario de exhumación: ' + (error.message || error));
    }
  }
}