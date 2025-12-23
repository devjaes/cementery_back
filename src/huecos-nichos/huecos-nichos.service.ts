import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { CreateHuecosNichoDto } from './dto/create-huecos-nicho.dto';
import { UpdateHuecosNichoDto } from './dto/update-huecos-nicho.dto';
import { HuecosNicho } from './entities/huecos-nicho.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Nicho } from 'src/nicho/entities/nicho.entity';
import { TipoNicho, puedeAgregarHuecos, obtenerMensajeErrorHuecos } from 'src/nicho/enum/tipoNicho.enum';

@Injectable()
export class HuecosNichosService {
  constructor(
    @InjectRepository(HuecosNicho)
    private readonly huecoRepository: Repository<HuecosNicho>,
    @InjectRepository(Nicho)
    private readonly nichoRepository: Repository<Nicho>,
  ) {}

  /**
   * Crea un nuevo hueco para un nicho
   */
  async create(
    createHuecosNichoDto: CreateHuecosNichoDto,
    file?: Express.Multer.File,
  ) {
    //console.log('Crear hueco DTO:', createHuecosNichoDto);
    try {
      if (!file) {
        throw new BadRequestException(
          'Se requiere un archivo PDF de ampliación (file)',
        );
      }
      if (file.mimetype !== 'application/pdf') {
        throw new BadRequestException('Solo se permiten archivos PDF');
      }
      // Normalizar id_nicho si llega como string
      if (typeof createHuecosNichoDto.id_nicho === 'string') {
        createHuecosNichoDto.id_nicho = {
          id_nicho: createHuecosNichoDto.id_nicho,
        };
      }

      // Normalizar id_fallecido si llega como string (opcional)
      if (
        createHuecosNichoDto.id_fallecido &&
        typeof createHuecosNichoDto.id_fallecido === 'string'
      ) {
        createHuecosNichoDto.id_fallecido = {
          id_persona: createHuecosNichoDto.id_fallecido,
        };
      }

      // Obtener el nicho para validar el tipo y restricciones
      const nicho = await this.nichoRepository.findOne({
        where: { id_nicho: createHuecosNichoDto.id_nicho.id_nicho },
      });

      if (!nicho) {
        throw new NotFoundException(
          `Nicho con ID ${createHuecosNichoDto.id_nicho.id_nicho} no encontrado`,
        );
      }

      // Validar que el nicho esté habilitado (tenga tipo)
      if (!nicho.tipo) {
        throw new BadRequestException(
          'El nicho debe estar habilitado antes de agregar huecos',
        );
      }

      // Obtener el número de huecos existentes para el nicho
      const count = await this.huecoRepository
        .createQueryBuilder('hueco')
        .where('hueco.id_nicho = :id_nicho', {
          id_nicho: createHuecosNichoDto.id_nicho.id_nicho,
        })
        .getCount();

      // Validar si se puede agregar un hueco más según el tipo de nicho
      const tipoNicho = nicho.tipo as TipoNicho;
      if (!puedeAgregarHuecos(tipoNicho, count)) {
        const mensajeError = obtenerMensajeErrorHuecos(tipoNicho);
        throw new BadRequestException(
          `No se puede agregar más huecos a este nicho. ${mensajeError}. Huecos actuales: ${count}`,
        );
      }

      createHuecosNichoDto.num_hueco = count + 1;

      // Guardar archivo en uploads/ampliaciones
      const { promises: fs } = await import('fs');
      const path = await import('path');
      const year = new Date().getFullYear();
      const codigoAmpliacion = `AMP-${year}-${Date.now()}`;
      const uploadPath = path.join(
        process.cwd(),
        'uploads',
        'ampliaciones',
        codigoAmpliacion,
      );

      try {
        await fs.mkdir(uploadPath, { recursive: true });
      } catch (error) {
        throw new BadRequestException('Error al crear directorio para PDF');
      }

      const timestamp = Date.now();
      const ext = path.extname(file.originalname) || '.pdf';
      const filename = `ampliacion_${timestamp}${ext}`;
      const filePath = path.join(uploadPath, filename);

      try {
        await fs.writeFile(filePath, file.buffer);
      } catch (error) {
        throw new BadRequestException('Error al guardar el archivo PDF');
      }

      const relativePath = `/uploads/ampliaciones/${codigoAmpliacion}/${filename}`;

      // Crear y guardar el hueco
      const hueco = this.huecoRepository.create(createHuecosNichoDto);
      (hueco as any).ruta_archivo_ampliacion = relativePath;
      (hueco as any).observacion_ampliacion =
        (createHuecosNichoDto as any).observacion_ampliacion ?? null;

      const savedHueco = await this.huecoRepository.save(hueco);

      // Actualizar el número de huecos en el nicho
      nicho.num_huecos = count + 1;
      await this.nichoRepository.save(nicho);

      return {
        hueco: savedHueco,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al crear el hueco del nicho: ' + (error.message || error),
      );
    }
  }

  /**
   * Obtiene todos los huecos con sus relaciones principales
   */
  findAll() {
    try {
      return this.huecoRepository
        .createQueryBuilder('hueco')
        .leftJoinAndSelect('hueco.id_nicho', 'nicho')
        .leftJoinAndSelect('nicho.id_bloque', 'bloque')
        .leftJoinAndSelect('hueco.id_fallecido', 'fallecido')
        .getMany()
        .then((huecos) =>
          huecos.map((h) => ({
            ...h,
            nicho: h.id_nicho,
            fallecido: h.id_fallecido,
            bloque: (h.id_nicho as any)?.id_bloque || null,
          })),
        );
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al obtener los huecos del nicho: ' + (error.message || error),
      );
    }
  }

  /**
   * Obtiene todos los huecos disponibles (estado = 'Disponible')
   */
  async findAllDisponibles() {
    try {
      const huecos = await this.huecoRepository
        .createQueryBuilder('hueco')
        .leftJoinAndSelect('hueco.id_nicho', 'nicho')
        .leftJoinAndSelect('nicho.id_bloque', 'bloque')
        .leftJoinAndSelect('hueco.id_fallecido', 'fallecido')
        .where('hueco.estado = :estado', { estado: 'Disponible' })
        .getMany();
      return huecos.map((h) => ({
        ...h,
        nicho: h.id_nicho,
        fallecido: h.id_fallecido,
        bloque: (h.id_nicho as any)?.id_bloque || null,
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al obtener los huecos disponibles del nicho: ' +
          (error.message || error),
      );
    }
  }

  /**
   * Busca un hueco por su ID y retorna sus relaciones principales
   */
  async findOne(id: string) {
    try {
      const hueco = await this.huecoRepository
        .createQueryBuilder('hueco')
        .leftJoinAndSelect('hueco.id_nicho', 'nicho')
        .leftJoinAndSelect('nicho.id_bloque', 'bloque')
        .leftJoinAndSelect('hueco.id_fallecido', 'fallecido')
        .where('hueco.id_detalle_hueco = :id', { id })
        .getOne();
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
        bloque: (hueco.id_nicho as any)?.id_bloque || null,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Error al buscar el hueco del nicho: ' + (error.message || error),
      );
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
        .leftJoinAndSelect('nicho.id_bloque', 'bloque')
        .leftJoinAndSelect('hueco.id_fallecido', 'fallecido')
        .where('nicho.id_nicho = :id_nicho', { id_nicho })
        .getMany();
      return huecos.map((h) => ({
        hueco: {
          ...h,
        },
        nicho: h.id_nicho,
        fallecido: h.id_fallecido,
        bloque: (h.id_nicho as any)?.id_bloque || null,
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al buscar los huecos por nicho: ' + (error.message || error),
      );
    }
  }

  /**
   * Actualiza los datos de un hueco por su ID
   */
  async update(id: string, updateDto: UpdateHuecosNichoDto, file?: Express.Multer.File) {
    try {
      const hueco = await this.findOne(id);
      Object.assign(hueco.hueco, updateDto);
      
      // Si llega nuevo PDF, reemplazarlo
      if (file) {
        if (file.mimetype !== 'application/pdf') {
          throw new BadRequestException('Solo se permiten archivos PDF');
        }

        const { promises: fs } = await import('fs');
        const path = await import('path');

        const rutaAnterior = (hueco.hueco as any).ruta_archivo_ampliacion as string | undefined;
        if (rutaAnterior) {
          const fullPath = path.join(process.cwd(), rutaAnterior);
          try {
            await fs.access(fullPath);
            await fs.unlink(fullPath);
          } catch {}
        }

        const year = new Date().getFullYear();
        const codigoAmpliacion = `AMP-${year}-${id.slice(0, 8)}`;
        const uploadPath = path.join(process.cwd(), 'uploads', 'ampliaciones', codigoAmpliacion);
        try {
          await fs.mkdir(uploadPath, { recursive: true });
        } catch (error) {
          throw new BadRequestException('Error al crear directorio para PDF');
        }

        const timestamp = Date.now();
        const ext = path.extname(file.originalname) || '.pdf';
        const filename = `ampliacion_${timestamp}${ext}`;
        const filePath = path.join(uploadPath, filename);
        try {
          await fs.writeFile(filePath, file.buffer);
        } catch (error) {
          throw new BadRequestException('Error al guardar el archivo PDF');
        }
        const relativePath = `/uploads/ampliaciones/${codigoAmpliacion}/${filename}`;
        (hueco.hueco as any).ruta_archivo_ampliacion = relativePath;
      }

      if ((updateDto as any).observacion_ampliacion !== undefined) {
        (hueco.hueco as any).observacion_ampliacion = (updateDto as any).observacion_ampliacion;
      }
      const savedHueco = await this.huecoRepository.save(hueco.hueco);
      return {
        hueco: savedHueco,
        nicho: hueco.nicho,
        fallecido: hueco.fallecido,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Error al actualizar el hueco del nicho: ' + (error.message || error),
      );
    }
  }

  /**
   * Elimina un hueco por su ID y actualiza el num_huecos del nicho
   */
  async remove(id: string) {
    try {
      // Obtener el hueco antes de eliminarlo para saber a qué nicho pertenece
      const hueco = await this.huecoRepository.findOne({
        where: { id_detalle_hueco: id },
        relations: ['id_nicho'],
      });

      if (!hueco) {
        throw new NotFoundException(`Hueco con ID ${id} no encontrado`);
      }

      const id_nicho = hueco.id_nicho?.id_nicho;

      // Eliminar el hueco
      const result = await this.huecoRepository.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`Hueco con ID ${id} no encontrado`);
      }

      // Si el hueco pertenecía a un nicho, actualizar el num_huecos
      if (id_nicho) {
        const huecosRestantes = await this.huecoRepository
          .createQueryBuilder('hueco')
          .where('hueco.id_nicho = :id_nicho', { id_nicho })
          .getCount();

        const nichoActualizado = await this.nichoRepository.findOne({
          where: { id_nicho },
        });

        if (nichoActualizado) {
          nichoActualizado.num_huecos = huecosRestantes;
          await this.nichoRepository.save(nichoActualizado);
        }
      }

      return { 
        deleted: true, 
        id,
        mensaje: 'Hueco eliminado y número de huecos del nicho actualizado',
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Error al eliminar el hueco del nicho: ' + (error.message || error),
      );
    }
  }

  async findAllDisponiblesByCementerio(id_cementerio: string) {
    try {
      const huecos = await this.huecoRepository
        .createQueryBuilder('hueco')
        .leftJoinAndSelect('hueco.id_nicho', 'nicho')
        .leftJoinAndSelect('nicho.id_bloque', 'bloque')
        .where('nicho.id_cementerio = :id_cementerio', { id_cementerio })
        .getMany();
      return huecos.map((h) => ({
        ...h,
        nicho: h.id_nicho,
        bloque: (h.id_nicho as any)?.id_bloque || null,
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al obtener los huecos disponibles por cementerio: ' +
          (error.message || error),
      );
    }
  }

  /**
   * Obtiene la ruta del archivo PDF de ampliación para un hueco
   */
  async obtenerRutaArchivo(id: string): Promise<string | null> {
    try {
      const hueco = await this.huecoRepository.findOne({
        where: { id_detalle_hueco: id },
        select: ['id_detalle_hueco', 'ruta_archivo_ampliacion'],
      });
      if (!hueco || !hueco.ruta_archivo_ampliacion) {
        return null;
      }
      return hueco.ruta_archivo_ampliacion;
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al obtener la ruta del archivo: ' + (error.message || error),
      );
    }
  }
}
