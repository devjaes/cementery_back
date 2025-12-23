import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { Nicho } from './entities/nicho.entity';
import { CreateNichoDto } from './dto/create-nicho.dto';
import { UpdateNichoDto } from './dto/update-nicho.dto';
import { HabilitarNichoDto } from './dto/habilitar-nicho.dto';
import { HuecosNicho } from 'src/huecos-nichos/entities/huecos-nicho.entity';
import { Persona } from 'src/personas/entities/persona.entity';
import { PropietarioNicho } from 'src/propietarios-nichos/entities/propietarios-nicho.entity';
import { EstadoNicho } from './enum/estadoNicho.enum';
import { TipoNicho, validarNumHuecosPorTipo, obtenerMensajeErrorHuecos } from './enum/tipoNicho.enum';
import { Bloque } from 'src/bloques/entities/bloque.entity';

@Injectable()
export class NichoService {
  constructor(
    @InjectRepository(Nicho)
    private readonly nichoRepository: Repository<Nicho>,
    @InjectRepository(HuecosNicho)
    private readonly huecosNichoRepository: Repository<HuecosNicho>,
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    @InjectRepository(PropietarioNicho)
    private readonly nichoPropietarioRepository: Repository<PropietarioNicho>,
    @InjectRepository(Bloque)
    private readonly bloqueRepository: Repository<Bloque>,
  ) { }

  /**
   * Crea un nuevo nicho y sus huecos asociados
   * NOTA: Este método ya no se usa normalmente. Los nichos se crean automáticamente
   * al crear un bloque. Este método se mantiene para casos especiales.
   */
  async create(createNichoDto: CreateNichoDto) {
    try {
      // Extraer el id del cementerio del DTO
      const id_cementerio =
        typeof createNichoDto.id_cementerio === 'string'
          ? createNichoDto.id_cementerio
          : (createNichoDto.id_cementerio as any)?.id_cementerio;

      if (!id_cementerio) {
        throw new BadRequestException('ID de cementerio no válido');
      }

      // Buscar el bloque con disponibilidad en el cementerio
      const bloqueDisponible =
        await this.encontrarBloqueDisponible(id_cementerio);

      if (!bloqueDisponible) {
        throw new BadRequestException(
          'No hay bloques disponibles en el cementerio. Por favor, cree un nuevo bloque.',
        );
      }

      // Crear el nicho y asignar el bloque
      const nicho = this.nichoRepository.create({
        ...createNichoDto,
        id_bloque: bloqueDisponible as any,
        estadoVenta: EstadoNicho.DESHABILITADO,
      });

      const nichoGuardado = await this.nichoRepository.save(nicho);

      return {
        nicho: nichoGuardado,
        bloque: {
          id_bloque: bloqueDisponible.id_bloque,
          nombre: bloqueDisponible.nombre,
          numero: bloqueDisponible.numero,
        },
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al crear el nicho: ' + (error.message || error),
      );
    }
  }

  /**
   * Encuentra el primer bloque con disponibilidad en el cementerio
   * Busca por orden de número ascendente
   */
  private async encontrarBloqueDisponible(
    id_cementerio: string,
  ): Promise<Bloque | null> {
    try {
      // Obtener todos los bloques activos del cementerio ordenados por número
      const bloques = await this.bloqueRepository.find({
        where: {
          id_cementerio: id_cementerio,
          estado: Not('Inactivo'),
        },
        order: { numero: 'ASC' },
        relations: ['nichos'],
      });

      if (bloques.length === 0) {
        return null;
      }

      // Buscar el primer bloque con disponibilidad
      for (const bloque of bloques) {
        const capacidadTotal = bloque.numero_filas * bloque.numero_columnas;
        const nichosActivos = Array.isArray(bloque.nichos)
          ? bloque.nichos.filter((n) => n.estado === 'Activo').length
          : 0;

        // Si hay espacio disponible, retornar este bloque
        if (nichosActivos < capacidadTotal) {
          return bloque;
        }
      }

      // Si todos están llenos, retornar null
      return null;
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al buscar bloque disponible: ' + (error.message || error),
      );
    }
  }

  /**
   * Obtiene todos los nichos activos con sus relaciones principales
   */
  async findAll(idCementerio?: string) {
    try {
      const where = { estado: 'Activo' };
      if (idCementerio) {
        where['id_cementerio'] = In([idCementerio as string]);
      }
      const nichos = await this.nichoRepository.find({
        where: where,
        relations: [
          'id_cementerio',
          'id_bloque',
          'inhumaciones',
          'propietarios_nicho',
          'huecos',
          'inhumaciones.id_fallecido',
          'huecos.id_fallecido',
        ],
      });
      // Mapeo para devolver relaciones con nombres más claros
      return nichos.map((nicho) => ({
        ...nicho,
        estadoVenta: (nicho as any).estadoVenta,
        cementerio: nicho.id_cementerio,
        bloque: nicho.id_bloque,
        inhumaciones: nicho.inhumaciones,
        propietarios: nicho.propietarios_nicho,
        huecos: nicho.huecos,
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al obtener los nichos: ' + (error.message || error),
      );
    }
  }

  /**
   * Habilita un nicho deshabilitado, asignándole tipo y número de huecos
   */
  async habilitarNicho(id_nicho: string, habilitarDto: HabilitarNichoDto) {
    try {
      // Buscar el nicho
      const nicho = await this.nichoRepository.findOne({
        where: { id_nicho: id_nicho },
        relations: ['id_bloque', 'id_cementerio'],
      });

      if (!nicho) {
        throw new NotFoundException(`Nicho con ID ${id_nicho} no encontrado`);
      }

      // Verificar que el nicho esté deshabilitado
      if (nicho.estadoVenta !== EstadoNicho.DESHABILITADO) {
        throw new BadRequestException(
          `El nicho ya está habilitado. Estado actual: ${nicho.estadoVenta}`,
        );
      }

      // Validar que el tipo de nicho sea válido
      const tipoValido = Object.values(TipoNicho).includes(habilitarDto.tipo as TipoNicho);
      if (!tipoValido) {
        throw new BadRequestException(
          `Tipo de nicho inválido. Tipos permitidos: ${Object.values(TipoNicho).join(', ')}`
        );
      }

      // Validar que el número de huecos sea compatible con el tipo de nicho
      const esValido = validarNumHuecosPorTipo(
        habilitarDto.tipo as TipoNicho,
        habilitarDto.num_huecos
      );

      if (!esValido) {
        const mensajeError = obtenerMensajeErrorHuecos(habilitarDto.tipo as TipoNicho);
        throw new BadRequestException(
          `Número de huecos inválido para el tipo ${habilitarDto.tipo}. ${mensajeError}`
        );
      }

      // Actualizar el nicho con los datos proporcionados
      nicho.tipo = habilitarDto.tipo;
      nicho.num_huecos = habilitarDto.num_huecos;
      nicho.fecha_construccion =
        habilitarDto.fecha_construccion || new Date().toISOString();
      nicho.observaciones = habilitarDto.observaciones;
      nicho.estadoVenta = EstadoNicho.DISPONIBLE;

      const nichoActualizado = await this.nichoRepository.save(nicho);

      // Crear los huecos asociados al nicho
      const huecos: HuecosNicho[] = [];
      for (let i = 1; i <= habilitarDto.num_huecos; i++) {
        const hueco = this.huecosNichoRepository.create({
          num_hueco: i,
          estado: 'Disponible',
          id_nicho: nichoActualizado,
        });
        huecos.push(hueco);
      }
      const huecosCreados = await this.huecosNichoRepository.save(huecos);

      return {
        id_nicho: nichoActualizado.id_nicho,
        fila: nichoActualizado.fila,
        columna: nichoActualizado.columna,
        tipo: nichoActualizado.tipo,
        num_huecos: nichoActualizado.num_huecos,
        estadoVenta: nichoActualizado.estadoVenta,
        fecha_construccion: nichoActualizado.fecha_construccion,
        observaciones: nichoActualizado.observaciones,
        bloque: {
          id_bloque: nichoActualizado.id_bloque.id_bloque,
          nombre: nichoActualizado.id_bloque.nombre,
          numero: nichoActualizado.id_bloque.numero,
        },
        cementerio: {
          id_cementerio: nichoActualizado.id_cementerio.id_cementerio,
          nombre: nichoActualizado.id_cementerio.nombre,
        },
        huecos: huecosCreados.map((h) => ({
          id_detalle_hueco: h.id_detalle_hueco,
          num_hueco: h.num_hueco,
          estado: h.estado,
        })),
        mensaje: `Nicho habilitado correctamente con ${huecosCreados.length} huecos`,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al habilitar el nicho: ' + (error.message || error),
      );
    }
  }

  /**
   * Obtiene todos los nichos con solo los huecos disponibles
   */
  async findAllWithHuecosDisponibles() {
    try {
      const nichos = await this.nichoRepository.find({
        relations: ['huecos', 'id_cementerio', 'id_bloque'],
      });
      // Filtra solo los huecos disponibles
      return nichos.map((nicho) => ({
        ...nicho,
        estadoVenta: (nicho as any).estadoVenta,
        bloque: nicho.id_bloque,
        huecos: nicho.huecos.filter((hueco) => hueco.estado === 'Disponible'),
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al obtener los nichos: ' + (error.message || error),
      );
    }
  }

  /**
   * Busca un nicho por su ID y retorna sus relaciones principales
   */
  async findOne(id: string) {
    try {
      const nicho = await this.nichoRepository.findOne({
        where: { id_nicho: id },
        relations: [
          'id_cementerio',
          'id_bloque',
          'inhumaciones',
          'propietarios_nicho',
          'huecos',
          'inhumaciones.id_fallecido',
          'huecos.id_fallecido',
        ],
      });
      if (!nicho) {
        throw new NotFoundException(`Nicho con ID ${id} no encontrado`);
      }
      return {
        ...nicho,
        estadoVenta: (nicho as any).estadoVenta,
        cementerio: nicho.id_cementerio,
        bloque: nicho.id_bloque,
        inhumaciones: nicho.inhumaciones,
        propietarios: nicho.propietarios_nicho,
        huecos: nicho.huecos,
      };
    } catch (error) {
      console.log(error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Error al buscar el nicho: ' + (error.message || error),
      );
    }
  }

  /**
   * Actualiza los datos de un nicho por su ID
   */
  async update(id: string, updateDto: UpdateNichoDto) {
    try {
      const nicho = await this.findOne(id);
      Object.assign(nicho, updateDto);
      const nichoActualizado = await this.nichoRepository.save(nicho);
      return {
        nicho: nichoActualizado,
        estadoVenta: (nichoActualizado as any).estadoVenta,
        cementerio: nicho.cementerio,
        inhumaciones: nicho.inhumaciones,
        propietarios: nicho.propietarios,
        huecos: nicho.huecos,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Error al actualizar el nicho: ' + (error.message || error),
      );
    }
  }

  /**
   * Marca un nicho como inactivo (eliminación lógica)
   */
  async remove(id: string) {
    try {
      const nicho = await this.nichoRepository.findOne({
        where: { id_nicho: id },
      });
      if (!nicho) {
        throw new NotFoundException(`Nicho con ID ${id} no encontrado`);
      }
      nicho.estado = 'Inactivo';
      await this.nichoRepository.save(nicho);
      return { deleted: true, id };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Error al eliminar el nicho: ' + (error.message || error),
      );
    }
  }

  /**
   * Obtiene los propietarios de un nicho por su ID
   */
  async findPropietariosNicho(id: string) {
    try {
      const nicho = await this.nichoRepository.findOne({
        where: { id_nicho: id },
        relations: ['propietarios_nicho'],
      });
      if (!nicho) {
        throw new NotFoundException(`Nicho con ID ${id} no encontrado`);
      }
      return {
        nicho: { ...nicho, propietarios_nicho: undefined },
        propietarios: nicho.propietarios_nicho,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Error al buscar los propietarios del nicho: ' +
        (error.message || error),
      );
    }
  }

  /**
   * Busca fallecidos en nichos por cédula, nombres o apellidos usando búsqueda parcial
   * Normaliza el texto para ser case-insensitive y sin acentos
   */
  async findByBusquedaFallecido(busqueda: string) {
    try {
      // Normalizar término de búsqueda (minúsculas y sin acentos)
      const busquedaNormalizada = this.normalizarTexto(busqueda);
      // Búsqueda parcial por cédula, nombres o apellidos (case-insensitive)
      const personas = await this.personaRepository
        .createQueryBuilder('persona')
        // .where('persona.fallecido = :fallecido', { fallecido: true })
        .andWhere(
          `(
            persona.cedula ILIKE :busqueda OR
            persona.nombres ILIKE :busqueda OR
            persona.apellidos ILIKE :busqueda
          )`,
          { busqueda: `%${busquedaNormalizada}%` },
        )
        .getMany();

      if (!personas || personas.length === 0) {
        throw new NotFoundException(
          `No se encontraron fallecidos que coincidan con: ${busqueda}`,
        );
      }

      // Buscar huecos para todas las personas encontradas
      const resultados: any[] = [];

      for (const persona of personas) {
        const huecos = await this.huecosNichoRepository.find({
          where: { id_fallecido: { id_persona: persona.id_persona } },
          relations: ['id_nicho', 'id_nicho.id_cementerio'],
        });

        if (huecos && huecos.length > 0) {
          resultados.push({
            fallecido: persona,
            huecos: huecos,
            nichos: huecos.map((h) => h.id_nicho),
            cementerios: huecos.map((h) => h.id_nicho?.id_cementerio),
          });
        }

        const nichosDuenos = await this.nichoRepository
          .createQueryBuilder('nicho')
          .leftJoinAndSelect('nicho.propietarios_nicho', 'propietario')
          .leftJoinAndSelect('nicho.huecos', 'huecos')
          .leftJoinAndSelect('huecos.id_nicho', 'hueco_nicho')
          .leftJoinAndSelect('huecos.id_fallecido', 'fallecido')
          .leftJoinAndSelect('nicho.id_cementerio', 'cementerio')
          .where('propietario.id_persona = :personaId', {
            personaId: persona.id_persona,
          })
          .andWhere('propietario.activo = :activo', { activo: true })
          .getMany();

        for (const nichoDueno of nichosDuenos) {
          // Ya tienes los huecos del nicho desde la consulta anterior

          const huecosDuenos = nichoDueno.huecos;

          // console.log(huecosDuenos);

          for (const huecoDueno of huecosDuenos) {
            const huecos = await this.huecosNichoRepository.find({
              where: { id_detalle_hueco: huecoDueno.id_detalle_hueco },
              relations: ['id_nicho', 'id_nicho.id_cementerio'],
            });

            let fallecido1: Persona | null = null;
            if (huecoDueno.id_fallecido) {
              fallecido1 = await this.personaRepository.findOne({
                where: { id_persona: huecoDueno.id_fallecido.id_persona },
              });
              resultados.push({
                fallecido: fallecido1,
                huecos: huecos,
                nichos: huecos.map((h) => h.id_nicho),
                cementerios: huecos.map((h) => h.id_nicho?.id_cementerio),
              });
            }
          }
        }
      }

      if (resultados.length === 0) {
        throw new NotFoundException(
          `No se encontraron nichos para fallecidos que coincidan con: ${busqueda}`,
        );
      }

      const sinDuplicados = resultados.filter(
        (resultado, index, self) =>
          index ===
          self.findIndex(
            (t) => t.fallecido.id_persona === resultado.fallecido.id_persona,
          ),
      );

      return {
        termino_busqueda: busqueda,
        total_encontrados: sinDuplicados.length,
        fallecidos: sinDuplicados,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Error al buscar los nichos por término de búsqueda: ' +
        (error.message || error),
      );
    }
  }

  /**
   * Busca nichos y huecos por la cédula del fallecido
   */
  async findByCedulaFallecido(cedula: string) {
    try {
      const persona = await this.personaRepository.findOne({
        where: { cedula: cedula, fallecido: true },
      });
      if (!persona) {
        throw new NotFoundException(
          `Persona con cédula ${cedula} no encontrada o no es un fallecido`,
        );
      }

      const hueco = await this.huecosNichoRepository.find({
        where: { id_fallecido: { id_persona: persona.id_persona } },
        relations: ['id_nicho', 'id_nicho.id_cementerio'],
      });

      return {
        fallecido: persona,
        huecos: hueco,
        nichos: hueco.map((h) => h.id_nicho),
        cementerios: hueco.map((h) => h.id_nicho?.id_cementerio),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Error al buscar los nichos por cédula del fallecido: ' +
        (error.message || error),
      );
    }
  }

  /**
   * Normaliza texto para búsqueda: convierte a minúsculas y remueve acentos
   */
  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  /**
   * Amplía un mausoleo agregando nuevas filas de nichos
   * Usa SQL raw para evitar problemas con TypeORM
   */
  async ampliarMausoleo(
    id_bloque: string,
    ampliarDto: any,
    file: Express.Multer.File,
  ) {
    try {
      // Convertir valores a números
      const numeroFilas = parseInt(ampliarDto.numero_filas, 10);
      const numeroColumnas = parseInt(ampliarDto.numero_columnas, 10);

      // Validar PDF
      if (!file || file.mimetype !== 'application/pdf') {
        throw new BadRequestException('Debe proporcionar un archivo PDF válido');
      }

      // Obtener bloque
      const bloque = await this.bloqueRepository.findOne({
        where: { id_bloque, estado: Not('Inactivo') },
        relations: ['cementerio'],
      });

      if (!bloque) {
        throw new NotFoundException('Bloque no encontrado');
      }

      if (bloque.tipo_bloque !== 'Mausoleo') {
        throw new BadRequestException('Solo se pueden ampliar bloques de tipo Mausoleo');
      }

      if (numeroColumnas !== bloque.numero_columnas) {
        throw new BadRequestException(
          `El número de columnas debe coincidir con el original (${bloque.numero_columnas})`,
        );
      }

      // Guardar PDF
      const { promises: fs } = await import('fs');
      const path = await import('path');
      const codigoAmpliacion = `AMP-${new Date().getFullYear()}-${Date.now()}`;
      const uploadPath = path.join(process.cwd(), 'uploads', 'ampliaciones', codigoAmpliacion);

      await fs.mkdir(uploadPath, { recursive: true });
      const filename = `ampliacion_${Date.now()}.pdf`;
      const filePath = path.join(uploadPath, filename);
      await fs.writeFile(filePath, file.buffer);
      const relativePath = `/uploads/ampliaciones/${codigoAmpliacion}/${filename}`;

      // Obtener último número de nicho
      const ultimoNichoResult = await this.nichoRepository.query(
        `SELECT COALESCE(MAX(CAST(numero AS INTEGER)), 0) as max_numero 
         FROM nichos 
         WHERE id_bloque = $1 AND estado = 'Activo'`,
        [id_bloque]
      );
      const ultimoNumero = parseInt(ultimoNichoResult[0]?.max_numero || '0', 10);

      // Calcular filas
      const filaInicial = bloque.numero_filas + 1;
      const filaFinal = bloque.numero_filas + numeroFilas;

      // Insertar nichos usando SQL RAW
      const nichosValues: string[] = [];
      const nichosParams: any[] = [];
      let paramIndex = 1;
      let numeroActual = ultimoNumero + 1;

      for (let fila = filaInicial; fila <= filaFinal; fila++) {
        for (let columna = 1; columna <= bloque.numero_columnas; columna++) {
          const fechaCreacion = new Date().toISOString();

          nichosValues.push(
            `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9}, $${paramIndex + 10})`
          );

          nichosParams.push(
            fila,                                    // fila
            columna,                                 // columna
            numeroActual.toString(),                 // numero
            'Activo',                                // estado
            'Disponible',                            // estadoVenta
            1,                                       // num_huecos
            'Nicho Simple',                          // tipo
            fechaCreacion,                           // fecha_construccion
            fechaCreacion,                           // fecha_adquisicion
            ampliarDto.observacion_ampliacion,       // observacion_ampliacion
            relativePath,                            // pdf_ampliacion
          );

          paramIndex += 11;
          numeroActual++;
        }
      }

      // Ejecutar INSERT con id_bloque e id_cementerio
      const insertSQL = `
        INSERT INTO nichos (
          fila, columna, numero, estado, "estadoVenta", num_huecos, tipo,
          fecha_construccion, fecha_adquisicion, observacion_ampliacion, pdf_ampliacion,
          id_bloque, id_cementerio
        ) VALUES ${nichosValues.map((v, i) => {
        const baseIndex = i * 11;
        return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10}, $${baseIndex + 11}, $${paramIndex}, $${paramIndex + 1})`;
      }).join(', ')}
        RETURNING id_nicho
      `;

      nichosParams.push(id_bloque, bloque.cementerio.id_cementerio);

      console.log('[NICHO SERVICE] Ejecutando INSERT directo');
      const insertResult = await this.nichoRepository.query(insertSQL, nichosParams);
      console.log('[NICHO SERVICE] Nichos insertados:', insertResult.length);

      // Crear huecos
      const huecosValues = insertResult.map((r: any, i: number) =>
        `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`
      ).join(', ');

      const huecosParams: any[] = [];
      insertResult.forEach((r: any) => {
        huecosParams.push(r.id_nicho, 1, 'Disponible');
      });

      await this.nichoRepository.query(
        `INSERT INTO huecos_nichos (id_nicho, num_hueco, estado) VALUES ${huecosValues}`,
        huecosParams
      );

      // Actualizar bloque
      await this.bloqueRepository.query(
        `UPDATE "Bloque" SET numero_filas = $1, fecha_modificacion = $2 WHERE id_bloque = $3`,
        [filaFinal, new Date().toISOString(), id_bloque]
      );

      return {
        mensaje: 'Mausoleo ampliado exitosamente',
        bloque: {
          id_bloque: bloque.id_bloque,
          nombre: bloque.nombre,
          numero_filas_anterior: bloque.numero_filas,
          numero_filas_nuevo: filaFinal,
          numero_columnas: bloque.numero_columnas,
        },
        ampliacion: {
          filas_agregadas: numeroFilas,
          nichos_creados: insertResult.length,
          huecos_creados: insertResult.length,
          rango_numeros: `${ultimoNumero + 1} - ${numeroActual - 1}`,
          observacion: ampliarDto.observacion_ampliacion,
          pdf: relativePath,
          codigo_ampliacion: codigoAmpliacion,
        },
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

  /**
   * Obtiene la información de ampliación de un nicho específico
   */
  async getAmpliacionNicho(id_nicho: string) {
    try {
      const nicho = await this.nichoRepository.findOne({
        where: { id_nicho },
      });

      if (!nicho) {
        throw new NotFoundException('Nicho no encontrado');
      }

      if (!nicho.observacion_ampliacion && !nicho.pdf_ampliacion) {
        throw new NotFoundException('Este nicho no tiene datos de ampliación');
      }

      return {
        id_nicho: nicho.id_nicho,
        numero: nicho.numero,
        observacion_ampliacion: nicho.observacion_ampliacion,
        pdf_ampliacion: nicho.pdf_ampliacion,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Error al obtener ampliación del nicho: ' + (error.message || error),
      );
    }
  }

  /**
   * Obtiene todos los nichos de ampliación de un bloque
   */
  async getAmpliacionesByBloque(id_bloque: string) {
    try {
      const bloque = await this.bloqueRepository.findOne({
        where: { id_bloque },
      });

      if (!bloque) {
        throw new NotFoundException('Bloque no encontrado');
      }

      const nichos = await this.nichoRepository.find({
        where: {
          id_bloque: id_bloque as any,  // Pasar el UUID directamente
          estado: 'Activo',
        },
        order: { fila: 'ASC', columna: 'ASC' },
      });

      // Filtrar solo los que tienen datos de ampliación
      const nichosAmpliacion = nichos.filter(
        n => n.observacion_ampliacion || n.pdf_ampliacion
      );

      return {
        id_bloque: bloque.id_bloque,
        nombre_bloque: bloque.nombre,
        total_ampliaciones: nichosAmpliacion.length,
        nichos: nichosAmpliacion.map(n => ({
          id_nicho: n.id_nicho,
          numero: n.numero,
          fila: n.fila,
          columna: n.columna,
          num_huecos: n.num_huecos,
          observacion_ampliacion: n.observacion_ampliacion,
          pdf_ampliacion: n.pdf_ampliacion,
          fecha_construccion: n.fecha_construccion,
        })),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Error al obtener ampliaciones: ' + (error.message || error),
      );
    }
  }

  /**
   * Descarga el PDF de ampliación de un nicho
   */
  async downloadPdfAmpliacion(id_nicho: string, res: any) {
    try {
      const nicho = await this.nichoRepository.findOne({
        where: { id_nicho },
      });

      if (!nicho) {
        throw new NotFoundException('Nicho no encontrado');
      }

      if (!nicho.pdf_ampliacion) {
        throw new NotFoundException('Este nicho no tiene PDF de ampliación');
      }

      const path = await import('path');
      const fs = await import('fs');

      // El pdf_ampliacion viene como /uploads/ampliaciones/...
      // Necesitamos la ruta completa del archivo
      const filePath = path.join(process.cwd(), nicho.pdf_ampliacion.substring(1));

      // Verificar que el archivo existe
      if (!fs.existsSync(filePath)) {
        throw new NotFoundException('Archivo PDF no encontrado en el servidor');
      }

      // Enviar el archivo
      res.sendFile(filePath);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Error al descargar PDF: ' + (error.message || error),
      );
    }
  }

  /**
   * Actualiza la información de ampliación de un nicho (observación y/o PDF)
   */
  async updateAmpliacion(
    id_nicho: string,
    updateDto: any,
    file?: Express.Multer.File,
  ) {
    try {
      // Buscar el nicho
      const nicho = await this.nichoRepository.findOne({
        where: { id_nicho },
      });

      if (!nicho) {
        throw new NotFoundException('Nicho no encontrado');
      }

      // Verificar que el nicho tiene datos de ampliación
      if (!nicho.observacion_ampliacion && !nicho.pdf_ampliacion) {
        throw new BadRequestException(
          'Este nicho no tiene datos de ampliación para actualizar',
        );
      }

      // Validar que al menos se proporcione un campo para actualizar
      if (!updateDto.observacion_ampliacion && !file) {
        throw new BadRequestException(
          'Debe proporcionar al menos un campo para actualizar (observacion_ampliacion o archivo PDF)',
        );
      }

      // Actualizar observación si se proporciona
      if (updateDto.observacion_ampliacion) {
        nicho.observacion_ampliacion = updateDto.observacion_ampliacion;
      }

      // Actualizar PDF si se proporciona
      if (file) {
        // Validar que sea un PDF
        if (file.mimetype !== 'application/pdf') {
          throw new BadRequestException('El archivo debe ser un PDF válido');
        }

        const { promises: fs } = await import('fs');
        const path = await import('path');

        // Generar nuevo código de ampliación para el archivo actualizado
        const codigoAmpliacion = `AMP-${new Date().getFullYear()}-${Date.now()}`;
        const uploadPath = path.join(
          process.cwd(),
          'uploads',
          'ampliaciones',
          codigoAmpliacion,
        );

        await fs.mkdir(uploadPath, { recursive: true });
        const filename = `ampliacion_${Date.now()}.pdf`;
        const filePath = path.join(uploadPath, filename);
        await fs.writeFile(filePath, file.buffer);
        const relativePath = `/uploads/ampliaciones/${codigoAmpliacion}/${filename}`;

        // Actualizar la ruta del PDF
        nicho.pdf_ampliacion = relativePath;
      }

      // Guardar cambios
      const nichoActualizado = await this.nichoRepository.save(nicho);

      return {
        mensaje: 'Ampliación actualizada exitosamente',
        nicho: {
          id_nicho: nichoActualizado.id_nicho,
          numero: nichoActualizado.numero,
          observacion_ampliacion: nichoActualizado.observacion_ampliacion,
          pdf_ampliacion: nichoActualizado.pdf_ampliacion,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al actualizar ampliación: ' + (error.message || error),
      );
    }
  }
}
