import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Nicho } from './entities/nicho.entity';
import { CreateNichoDto } from './dto/create-nicho.dto';
import { UpdateNichoDto } from './dto/update-nicho.dto';
import { HuecosNicho } from 'src/huecos-nichos/entities/huecos-nicho.entity';
import { Persona } from 'src/personas/entities/persona.entity';
import { PropietarioNicho } from 'src/propietarios-nichos/entities/propietarios-nicho.entity';
import { EstadoNicho } from './enum/estadoNicho.enum';
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
   * Asigna automáticamente el bloque con disponibilidad según el orden de numeración
   */
  async create(createNichoDto: CreateNichoDto) {
    try {
      // Extraer el id del cementerio del DTO
      const id_cementerio = typeof createNichoDto.id_cementerio === 'string' 
        ? createNichoDto.id_cementerio 
        : (createNichoDto.id_cementerio as any)?.id_cementerio;

      if (!id_cementerio) {
        throw new BadRequestException('ID de cementerio no válido');
      }

      // Buscar el bloque con disponibilidad en el cementerio
      const bloqueDisponible = await this.encontrarBloqueDisponible(id_cementerio);

      if (!bloqueDisponible) {
        throw new BadRequestException(
          'No hay bloques disponibles en el cementerio. Por favor, cree un nuevo bloque.'
        );
      }

      // Crear el nicho y asignar el bloque
      const nicho = this.nichoRepository.create({
        ...createNichoDto,
        id_bloque: bloqueDisponible as any,
      });
      
      const nichoGuardado = await this.nichoRepository.save(nicho);

      // Crear los huecos asociados al nicho
      const huecos: HuecosNicho[] = [];
      for (let i = 1; i <= nichoGuardado.num_huecos; i++) {
        const hueco = this.huecosNichoRepository.create({
          num_hueco: i,
          estado: 'Disponible',
          id_nicho: nichoGuardado,
        });
        huecos.push(hueco);
      }
      const huecosGuardados = await this.huecosNichoRepository.save(huecos);
      
      // Aseguramos que estadoVenta esté presente en la respuesta
      const estadoVenta = (nichoGuardado as any).estadoVenta ?? EstadoNicho.DISPONIBLE;
      
      return {
        ...nichoGuardado,
        estadoVenta,
        huecos: huecosGuardados,
        bloque: {
          id_bloque: bloqueDisponible.id_bloque,
          nombre: bloqueDisponible.nombre,
          numero: bloqueDisponible.numero,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
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
  private async encontrarBloqueDisponible(id_cementerio: string): Promise<Bloque | null> {
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
          ? bloque.nichos.filter(n => n.estado === 'Activo').length 
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
  async findAll() {
    try {
      const nichos = await this.nichoRepository.find({
        where: { estado: 'Activo' },
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
}
