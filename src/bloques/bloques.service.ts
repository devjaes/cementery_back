import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { CreateBloqueDto } from './dto/create-bloque.dto';
import { UpdateBloqueDto } from './dto/update-bloque.dto';
import { AmpliarBloqueDto } from './dto/ampliar-bloque.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Bloque } from './entities/bloque.entity';
import { Cementerio } from 'src/cementerio/entities/cementerio.entity';
import { Nicho } from 'src/nicho/entities/nicho.entity';
import { HuecosNicho } from 'src/huecos-nichos/entities/huecos-nicho.entity';
import { Like, Repository, Not } from 'typeorm';
import { EstadoNicho } from 'src/nicho/enum/estadoNicho.enum';

@Injectable()
export class BloquesService {
  constructor(
    @InjectRepository(Bloque)
    private readonly bloqueRepository: Repository<Bloque>,
    @InjectRepository(Cementerio)
    private readonly cementerioRepository: Repository<Cementerio>,
    @InjectRepository(Nicho)
    private readonly nichoRepository: Repository<Nicho>,
    @InjectRepository(HuecosNicho)
    private readonly huecosNichoRepository: Repository<HuecosNicho>,
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
          id_cementerio: createBloqueDto.id_cementerio,
          estado: Not('Inactivo'), // Solo verificar contra bloques activos
        },
      });
      if (existente) {
        throw new BadRequestException(
          'Ya existe un bloque activo con ese nombre en el cementerio',
        );
      }

      // Obtener el siguiente número disponible para el cementerio
      const bloquesDelCementerio = await this.bloqueRepository.find({
        where: {
          id_cementerio: createBloqueDto.id_cementerio,
        },
        order: { numero: 'DESC' },
      });

      // Calcular el siguiente número: si hay bloques con número válido, usar max + 1, sino 1
      let siguienteNumero = 1;
      if (bloquesDelCementerio.length > 0) {
        const numerosValidos = bloquesDelCementerio
          .map(b => b.numero)
          .filter(n => n != null && !isNaN(n));

        if (numerosValidos.length > 0) {
          siguienteNumero = Math.max(...numerosValidos) + 1;
        }
      }

      // Crea y guarda el bloque — asignar campos explícitamente para evitar
      // que el DTO con la propiedad `id_cementerio` string quede dentro del objeto
      const bloque = this.bloqueRepository.create();
      bloque.nombre = createBloqueDto.nombre;
      bloque.descripcion = createBloqueDto.descripcion ?? undefined;
      bloque.numero = siguienteNumero; // Asignar número automáticamente
      bloque.numero_filas = createBloqueDto.numero_filas;
      bloque.numero_columnas = createBloqueDto.numero_columnas;
      bloque.tipo_bloque = createBloqueDto.tipo_bloque || 'Bloque'; // Por defecto 'Bloque'
      // asignar la entidad Cementerio como relación
      bloque.cementerio = cementerio as any;
      try {
        // also set the raw id to ensure correct FK value (some TypeORM versions
        // correctly accept string here)
        (bloque as any).id_cementerio = cementerio.id_cementerio;
      } catch (e) {
        // ignore
      }

      // Logging temporal para depuración: mostrar qué se va a guardar
      try {
        console.log('DEBUG: bloque entity before save:', JSON.stringify({
          nombre: bloque.nombre,
          descripcion: bloque.descripcion,
          numero_filas: bloque.numero_filas,
          numero_columnas: bloque.numero_columnas,
          id_cementerio: (bloque.cementerio as any)?.id_cementerio || (bloque as any).id_cementerio,
        }));
      } catch (e) {
        console.log('DEBUG: could not stringify bloque', e);
      }
      // Más logging: tipo y valor crudo de la propiedad de relación
      try {
        console.log('DEBUG: typeof bloque.id_cementerio ->', typeof (bloque as any).id_cementerio);
        console.log('DEBUG: raw bloque.id_cementerio ->', (bloque as any).id_cementerio);
      } catch (e) {
        console.log('DEBUG: could not inspect id_cementerio', e);
      }

      const savedBloque = await this.bloqueRepository.save(bloque);

      // Crear nichos automáticamente según filas y columnas
      // Ambos tipos (Bloque y Mausoleo) crean nichos DISPONIBLES con 1 hueco
      const nichos: Nicho[] = [];

      for (let fila = 1; fila <= savedBloque.numero_filas; fila++) {
        for (let columna = 1; columna <= savedBloque.numero_columnas; columna++) {
          const fechaCreacion = new Date().toISOString();
          const nicho = this.nichoRepository.create();
          nicho.id_bloque = savedBloque as any;
          nicho.id_cementerio = cementerio as any;
          nicho.fila = fila;
          nicho.columna = columna;
          nicho.estado = 'Activo';
          nicho.estadoVenta = EstadoNicho.DISPONIBLE;
          nicho.num_huecos = 1;
          nicho.tipo = 'Nicho Simple';
          nicho.fecha_construccion = fechaCreacion;
          nicho.fecha_adquisicion = fechaCreacion;

          nichos.push(nicho);
        }
      }

      const nichosCreados = await this.nichoRepository.save(nichos);

      // Crear los huecos automáticamente para todos los nichos
      const huecos: HuecosNicho[] = [];
      for (const nicho of nichosCreados) {
        const hueco = this.huecosNichoRepository.create({
          id_nicho: nicho,
          num_hueco: 1,
          estado: 'Disponible',
        });
        huecos.push(hueco);
      }
      const savedHuecos = await this.huecosNichoRepository.save(huecos);

      const mensajeTipo = savedBloque.tipo_bloque === 'Mausoleo'
        ? `Mausoleo creado con ${nichosCreados.length} nichos habilitados (1 hueco cada uno). Venta conjunta habilitada.`
        : `Bloque creado con ${nichosCreados.length} nichos habilitados (1 hueco cada uno)`;

      return {
        bloque: {
          ...savedBloque,
          tipo_bloque: savedBloque.tipo_bloque,
        },
        nichos_creados: nichosCreados.length,
        huecos_creados: savedHuecos.length,
        mensaje: mensajeTipo
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      // Preparar debug para devolver en la respuesta y facilitar la depuración
      const debugInfo: any = {};
      try {
        debugInfo.typeof_id_cementerio = typeof (((this as any).bloque)?.id_cementerio || (({} as any)).id_cementerio);
      } catch (e) {
        debugInfo.typeof_id_cementerio = 'unknown';
      }
      try {
        debugInfo.raw_id_cementerio = (((this as any).bloque)?.id_cementerio) || (({} as any)).id_cementerio;
      } catch (e) {
        debugInfo.raw_id_cementerio = null;
      }
      // Incluir el body recibido para inspección
      debugInfo.incomingBody = (this as any).incomingBody || null;

      throw new InternalServerErrorException({
        message: 'Error al crear el bloque: ' + (error.message || error),
        debug: debugInfo,
      });
    }
  }

  /**
   * Obtiene todos los bloques activos
   */
  async findAll() {
    try {
      const bloques = await this.bloqueRepository.find({
        where: { estado: Not('Inactivo') }, // Solo bloques activos
        relations: ['cementerio'],
      });
      // Incluir tipo_bloque en la respuesta
      const bloquesConTipo = bloques.map(bloque => ({
        ...bloque,
        tipo_bloque: bloque.tipo_bloque || 'Bloque',
      }));
      return { bloques: bloquesConTipo };
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
          id_cementerio: id_cementerio,
          estado: Not('Inactivo'), // Solo bloques activos
        },
        relations: ['cementerio'],
      });
      // Incluir tipo_bloque en la respuesta
      const bloquesConTipo = bloques.map(bloque => ({
        ...bloque,
        tipo_bloque: bloque.tipo_bloque || 'Bloque',
      }));
      return { bloques: bloquesConTipo };
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
        relations: ['cementerio', 'nichos'],
      });
      if (!bloque) {
        throw new NotFoundException('Bloque no encontrado o inactivo');
      }
      // Incluir tipo_bloque en la respuesta
      return {
        bloque: {
          ...bloque,
          tipo_bloque: bloque.tipo_bloque || 'Bloque',
        }
      };
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
        relations: ['cementerio'],
      });
      if (!bloque) {
        throw new NotFoundException('Bloque no encontrado o inactivo');
      }

      let cementerio = bloque.cementerio;

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
            id_cementerio: cementerio.id_cementerio,
            estado: Not('Inactivo'), // Solo verificar contra bloques activos
          },
        });
        if (existente && existente.id_bloque !== id) {
          throw new BadRequestException(
            'Ya existe un bloque activo con ese nombre en el cementerio',
          );
        }
      }

      // Actualizar solo los campos simples (no relaciones)
      const { id_cementerio: idCem, ...fieldsToUpdate } = updateBloqueDto as any;
      if (Object.keys(fieldsToUpdate).length > 0) {
        await this.bloqueRepository.update(id, fieldsToUpdate);
      }

      // Si se cambió el cementerio, asignarlo y guardar la entidad completa
      if (updateBloqueDto.id_cementerio) {
        bloque.cementerio = cementerio as any;
        try {
          (bloque as any).id_cementerio = cementerio.id_cementerio;
        } catch (e) { }
        await this.bloqueRepository.save(bloque);
      }

      const updatedBloque = await this.bloqueRepository.findOne({
        where: { id_bloque: id },
        relations: ['cementerio'],
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
      const nichosArray = Array.isArray(bloque.nichos) ? bloque.nichos : [];
      if (nichosArray.length > 0) {
        const nichosActivos = nichosArray.filter(n => n.estado !== 'Inactivo');
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
        relations: ['cementerio'],
      });
      return { bloques };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al buscar bloques: ' + (error.message || error),
      );
    }
  }

  /**
   * Obtiene todos los nichos de un bloque específico
   */
  async findNichosByBloque(id_bloque: string) {
    try {
      const bloque = await this.bloqueRepository.findOne({
        where: {
          id_bloque: id_bloque,
          estado: Not('Inactivo'),
        },
        relations: [
          'cementerio',
          'nichos',
          'nichos.huecos',
          'nichos.propietarios_nicho',
          'nichos.inhumaciones',
        ],
      });

      if (!bloque) {
        throw new NotFoundException('Bloque no encontrado o inactivo');
      }

      // Filtrar solo nichos activos
      const nichosActivos = bloque.nichos.filter(n => n.estado === 'Activo');

      return {
        bloque: {
          id_bloque: bloque.id_bloque,
          nombre: bloque.nombre,
          numero: bloque.numero,
          numero_filas: bloque.numero_filas,
          numero_columnas: bloque.numero_columnas,
          descripcion: bloque.descripcion,
          cementerio: bloque.cementerio,
        },
        nichos: nichosActivos.map(nicho => ({
          ...nicho,
          estadoVenta: (nicho as any).estadoVenta,
        })),
        total_nichos: nichosActivos.length,
        capacidad_total: bloque.numero_filas * bloque.numero_columnas,
        espacios_disponibles: (bloque.numero_filas * bloque.numero_columnas) - nichosActivos.length,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al obtener los nichos del bloque: ' + (error.message || error),
      );
    }
  }

  /**
   * Amplía un mausoleo agregando nuevas filas de nichos
   * Solo permite crecimiento vertical (las columnas deben coincidir con el original)
   */
  async ampliarBloque(
    id_bloque: string,
    ampliarBloqueDto: AmpliarBloqueDto,
    file: Express.Multer.File,
  ) {
    try {
      // Validar que se haya enviado el archivo PDF
      if (!file) {
        throw new BadRequestException(
          'Se requiere un archivo PDF de ampliación (file)',
        );
      }
      if (file.mimetype !== 'application/pdf') {
        throw new BadRequestException('Solo se permiten archivos PDF');
      }

      // Buscar el bloque con sus nichos
      const bloque = await this.bloqueRepository.findOne({
        where: {
          id_bloque: id_bloque,
          estado: Not('Inactivo'),
        },
        relations: ['cementerio', 'nichos'],
      });

      if (!bloque) {
        throw new NotFoundException('Bloque no encontrado o inactivo');
      }

      // Validar que sea un mausoleo
      if (bloque.tipo_bloque !== 'Mausoleo') {
        throw new BadRequestException(
          'Solo se pueden ampliar bloques de tipo Mausoleo',
        );
      }

      // Validar que el número de columnas coincida con el original
      if (ampliarBloqueDto.numero_columnas !== bloque.numero_columnas) {
        throw new BadRequestException(
          `El número de columnas debe coincidir con el original (${bloque.numero_columnas}). La ampliación solo permite crecimiento vertical.`,
        );
      }

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

      // Obtener el último número de nicho existente
      const nichosActivos = bloque.nichos.filter((n) => n.estado === 'Activo');
      let ultimoNumero = 0;

      if (nichosActivos.length > 0) {
        // Buscar el número más alto entre los nichos existentes
        nichosActivos.forEach((nicho) => {
          if (nicho.numero) {
            const num = parseInt(nicho.numero, 10);
            if (!isNaN(num) && num > ultimoNumero) {
              ultimoNumero = num;
            }
          }
        });
      }

      // Calcular las nuevas filas
      const filaInicial = bloque.numero_filas + 1;
      const filaFinal = bloque.numero_filas + ampliarBloqueDto.numero_filas;

      // Crear los nuevos nichos
      const nuevosNichos: Nicho[] = [];
      let numeroActual = ultimoNumero + 1;

      for (let fila = filaInicial; fila <= filaFinal; fila++) {
        for (let columna = 1; columna <= bloque.numero_columnas; columna++) {
          const fechaCreacion = new Date().toISOString();
          const nicho = this.nichoRepository.create();
          nicho.id_bloque = bloque as any;
          nicho.id_cementerio = bloque.cementerio as any;
          nicho.fila = fila;
          nicho.columna = columna;
          nicho.numero = numeroActual.toString();
          nicho.estado = 'Activo';
          nicho.estadoVenta = EstadoNicho.DISPONIBLE;
          nicho.num_huecos = 1;
          nicho.tipo = 'Nicho Simple';
          nicho.fecha_construccion = fechaCreacion;
          nicho.fecha_adquisicion = fechaCreacion;
          nicho.observacion_ampliacion = ampliarBloqueDto.observacion_ampliacion;
          nicho.pdf_ampliacion = relativePath;

          nuevosNichos.push(nicho);
          numeroActual++;
        }
      }

      // Guardar los nuevos nichos
      const nichosCreados = await this.nichoRepository.save(nuevosNichos);

      // Crear los huecos para los nuevos nichos
      const nuevosHuecos: HuecosNicho[] = [];
      for (const nicho of nichosCreados) {
        const hueco = this.huecosNichoRepository.create({
          id_nicho: nicho,
          num_hueco: 1,
          estado: 'Disponible',
        });
        nuevosHuecos.push(hueco);
      }
      const huecosCreados = await this.huecosNichoRepository.save(nuevosHuecos);

      // Actualizar el número de filas del bloque
      bloque.numero_filas = filaFinal;
      bloque.fecha_modificacion = new Date().toISOString();
      await this.bloqueRepository.save(bloque);

      return {
        mensaje: 'Mausoleo ampliado exitosamente',
        bloque: {
          id_bloque: bloque.id_bloque,
          nombre: bloque.nombre,
          numero_filas_anterior: filaInicial - 1,
          numero_filas_nuevo: bloque.numero_filas,
          numero_columnas: bloque.numero_columnas,
        },
        ampliacion: {
          filas_agregadas: ampliarBloqueDto.numero_filas,
          nichos_creados: nichosCreados.length,
          huecos_creados: huecosCreados.length,
          rango_numeros: `${ultimoNumero + 1} - ${numeroActual - 1}`,
          observacion: ampliarBloqueDto.observacion_ampliacion,
          pdf: relativePath,
          codigo_ampliacion: codigoAmpliacion,
        },
        total_nichos_bloque: nichosActivos.length + nichosCreados.length,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al ampliar el mausoleo: ' + (error.message || error),
      );
    }
  }
}
