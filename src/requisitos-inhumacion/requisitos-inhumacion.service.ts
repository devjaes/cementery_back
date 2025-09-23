import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { RequisitosInhumacion } from './entities/requisitos-inhumacion.entity';
import { CreateRequisitosInhumacionDto } from './dto/create-requisitos-inhumacion.dto';
import { UpdateRequisitosInhumacionDto } from './dto/update-requisitos-inhumacion.dto';
import { Inhumacion } from 'src/inhumaciones/entities/inhumacion.entity';
import { HuecosNicho } from 'src/huecos-nichos/entities/huecos-nicho.entity';
import { Persona } from 'src/personas/entities/persona.entity';
import { Nicho } from 'src/nicho/entities/nicho.entity';
import { Cementerio } from 'src/cementerio/entities/cementerio.entity';

@Injectable()
export class RequisitosInhumacionService {
  constructor(
    @InjectRepository(RequisitosInhumacion)
    private repo: Repository<RequisitosInhumacion>,
    @InjectRepository(Inhumacion)
    private inhumacionRepo: Repository<Inhumacion>,
    @InjectRepository(HuecosNicho)
    private huecosNichoRepo: Repository<HuecosNicho>,
    @InjectRepository(Persona)
    private personaRepo: Repository<Persona>,
    @InjectRepository(Nicho)
    private nichoRepo: Repository<Nicho>,
    @InjectRepository(Cementerio)
    private cementerioRepo: Repository<Cementerio>,
  ) { }

  /**
   * Crea un nuevo registro de requisitos de inhumación
   */
  async create(dto: CreateRequisitosInhumacionDto) {
    try {
      // Normalizar los IDs si llegan como string
      if (typeof dto.id_fallecido === 'string') {
        dto.id_fallecido = { id_persona: dto.id_fallecido };
      }
      if (typeof dto.id_solicitante === 'string') {
        dto.id_solicitante = { id_persona: dto.id_solicitante };
      }
      if (typeof dto.id_cementerio === 'string') {
        dto.id_cementerio = { id_cementerio: dto.id_cementerio };
      }
      if (typeof dto.id_hueco_nicho === 'string') {
        dto.id_hueco_nicho = { id_detalle_hueco: dto.id_hueco_nicho };
      }

      // Buscar hueco de nicho y validar disponibilidad
      const huecoNicho = await this.huecosNichoRepo.findOne({
        where: { id_detalle_hueco: dto.id_hueco_nicho.id_detalle_hueco },
        relations: ['id_nicho', 'id_nicho.propietarios_nicho', 'id_nicho.id_cementerio'],
      });
      if (!huecoNicho) {
        throw new NotFoundException('Hueco de nicho no encontrado');
      }
      if (huecoNicho.estado !== 'Disponible') {
        throw new ConflictException(
          'El hueco del nicho seleccionado no está disponible',
        );
      }

      // Control: Validar que el hueco pertenezca al cementerio indicado
      if (
        !huecoNicho.id_nicho ||
        !huecoNicho.id_nicho.id_cementerio ||
        (typeof dto.id_cementerio === 'object' && dto.id_cementerio.id_cementerio !== huecoNicho.id_nicho.id_cementerio.id_cementerio)
      ) {
        throw new BadRequestException('El hueco seleccionado no pertenece al cementerio indicado');
      }

      // Buscar persona fallecida
      const personaFallecido = await this.personaRepo.findOne({
        where: { id_persona: dto.id_fallecido.id_persona },
      });
      if (!personaFallecido) {
        throw new NotFoundException(
          `Fallecido con ID ${dto.id_fallecido.id_persona} no encontrado`,
        );
      }

      // Buscar solicitante y validar que no sea fallecido
      const solicitante = await this.personaRepo.findOne({
        where: { id_persona: dto.id_solicitante.id_persona },
      });
      if (!solicitante) {
        throw new NotFoundException(
          `Solicitante con ID ${dto.id_solicitante.id_persona} no encontrado`,
        );
      }
      if (solicitante.fallecido == true) {
        throw new ConflictException('El solicitante no puede ser un fallecido');
      }

      // Validar que no exista ya un requisito para el fallecido
      const existeRequisito = await this.repo.findOne({
        where: { id_fallecido: { id_persona: dto.id_fallecido.id_persona } },
      });
      if (existeRequisito) {
        throw new ConflictException(
          `Ya existe un requisito de inhumación para el fallecido con ID ${dto.id_fallecido.id_persona}`,
        );
      }

      // Validar que solicitante y fallecido no sean la misma persona
      if (dto.id_fallecido == dto.id_solicitante || dto.id_solicitante == dto.id_fallecido) {
        throw new BadRequestException('El solicitante no puede ser el mismo que el fallecido y  viceversa');
      }

      // Validar que el fallecido no esté ya enterrado en un hueco
      const huecoOcupado = await this.huecosNichoRepo.findOne({
        where: { id_fallecido: { id_persona: dto.id_fallecido.id_persona } },
      });
      if (huecoOcupado) {
        throw new ConflictException(
          `El fallecido con ID ${dto.id_fallecido.id_persona} ya está enterrado en un nicho`
        );
      }

      // Crear y guardar el requisito
      const entity = this.repo.create(dto);
      const savedEntity = await this.repo.save(entity);

      // Verifica todos los booleanos requeridos (excepto autorizacionDeMovilizacionDelCadaver)
      const allRequiredTrue =
        savedEntity.copiaCedula === true &&
        savedEntity.copiaCertificadoDefuncion === true &&
        savedEntity.informeEstadisticoINEC === true &&
        savedEntity.pagoTasaInhumacion === true &&
        savedEntity.copiaTituloPropiedadNicho === true &&
        savedEntity.OficioDeSolicitud === true;

      // Generar código de inhumación secuencial por año
      const year = new Date().getFullYear();
      const count = await this.inhumacionRepo
        .createQueryBuilder('inhumacion')
        .where('EXTRACT(YEAR FROM inhumacion.fecha_inhumacion) = :year', {
          year,
        })
        .getCount();
      const secuencial = String(count + 1).padStart(3, '0');
      const codigo_inhumacion = `${secuencial}-${year}`;

      const nomSolicitante = solicitante.nombres + ' ' + solicitante.apellidos;

      // Crear la inhumación asociada
      const inhumacion = this.inhumacionRepo.create({
        id_nicho: huecoNicho.id_nicho,
        id_fallecido: savedEntity.id_fallecido,
        fecha_inhumacion: savedEntity.fechaInhumacion,
        hora_inhumacion: savedEntity.horaInhumacion,
        solicitante: nomSolicitante,
        responsable_inhumacion: savedEntity.pantoneroACargo,
        observaciones: savedEntity.observacionSolicitante,
        estado: allRequiredTrue ? 'Realizada' : 'Pendiente',
        codigo_inhumacion: codigo_inhumacion,
        id_requisitos_inhumacion: savedEntity,
      });

      // Si cumple todos los requisitos, marcar hueco como ocupado y asignar fallecido
      if (allRequiredTrue) {
        const hueco = await this.huecosNichoRepo.findOne({
          where: { id_detalle_hueco: huecoNicho.id_detalle_hueco },
        });
        if (!hueco) {
          throw new NotFoundException('Hueco de nicho no encontrado');
        }
        hueco.estado = 'Ocupado';
        hueco.id_fallecido = savedEntity.id_fallecido;
        await this.huecosNichoRepo.save(hueco);
      }

      // Marcar persona como fallecida y guardar fecha de inhumación
      personaFallecido.fecha_inhumacion = savedEntity.fechaInhumacion;
      personaFallecido.fallecido = true;
      await this.personaRepo.save(personaFallecido);

      // Guardar la inhumación
      const savedInhumacion = await this.inhumacionRepo.save(inhumacion);

      // Respuesta explícita
      return {
        ...savedEntity,
        inhumacion: savedInhumacion,
        huecoNicho: allRequiredTrue ? huecoNicho : undefined,
        fallecido: personaFallecido,
        solicitante: solicitante,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al crear el requisito: ' + (error.message || error));
    }
  }

  /**
   * Obtiene todos los requisitos de inhumación
   */
  async findAll() {
    try {
      const requisitos = await this.repo.find({
        relations: [
          'id_cementerio',
          'id_solicitante',
          'id_hueco_nicho',
          'id_hueco_nicho.id_nicho',
          'id_hueco_nicho.id_nicho.propietarios_nicho',
          'id_fallecido',
        ],
      });
      // Mapeo: separa cada objeto relacionado
      return requisitos.map((req) => ({
        ...req,
        cementerio: req.id_cementerio,
        solicitante: req.id_solicitante,
        huecoNicho: req.id_hueco_nicho,
        nicho: req.id_hueco_nicho?.id_nicho,
        propietarioNicho: req.id_hueco_nicho?.id_nicho?.propietarios_nicho,
        fallecido: req.id_fallecido,
      }));
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener los requisitos: ' + (error.message || error));
    }
  }

  /**
   * Obtiene un requisito de inhumación por su ID
   */
  async findOne(id: string) {
    try {
      const record = await this.repo.findOne({
        where: { id_requsitoInhumacion: id },
        relations: [
          'id_cementerio',
          'id_solicitante',
          'id_hueco_nicho',
          'id_hueco_nicho.id_nicho',
          'id_hueco_nicho.id_nicho.propietarios_nicho',
          'id_fallecido',
          'inhumacion',
        ],
      });
      if (!record) throw new NotFoundException(`Requisito ${id} no encontrado`);
      // Mapeo: separa cada objeto relacionado

      return {
        ...record,
        cementerio: record.id_cementerio,
        solicitante: record.id_solicitante,
        huecoNicho: record.id_hueco_nicho,
        nicho: record.id_hueco_nicho?.id_nicho,
        propietarioNicho: record.id_hueco_nicho?.id_nicho?.propietarios_nicho,
        fallecido: record.id_fallecido,
        inhumacion: record.inhumacion,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al buscar el requisito: ' + (error.message || error));
    }
  }

  /**
   * Actualiza un requisito de inhumación por su ID
   */
  async update(id: string, dto: UpdateRequisitosInhumacionDto) {
    try {
      const requisito = await this.repo.findOne({
        where: { id_requsitoInhumacion: id },
        relations: [
          'inhumacion',
          'id_hueco_nicho',
          'id_solicitante',
          'id_fallecido',
        ],
      });
      if (!requisito) {
        throw new NotFoundException(`Requisito ${id} no encontrado`);
      }
      const updatedRequisito = this.repo.merge(requisito, dto);
      const savedEntity = await this.repo.save(updatedRequisito);

      // Verifica todos los booleanos requeridos (excepto autorizacionDeMovilizacionDelCadaver)
      const allRequiredTrue =
        savedEntity.copiaCedula === true &&
        savedEntity.copiaCertificadoDefuncion === true &&
        savedEntity.informeEstadisticoINEC === true &&
        savedEntity.pagoTasaInhumacion === true &&
        savedEntity.copiaTituloPropiedadNicho === true &&
        savedEntity.OficioDeSolicitud === true;

      let savedHuecoNicho: HuecosNicho | null = null;
      let personaFallecido = savedEntity.id_fallecido;

      // Actualiza el estado de la inhumación asociada si existe
      if (savedEntity.inhumacion) {
        savedEntity.inhumacion.estado = allRequiredTrue
          ? 'Realizada'
          : 'Pendiente';
        await this.inhumacionRepo.save(savedEntity.inhumacion);

        // Actualiza datos del fallecido
        personaFallecido.fecha_defuncion = savedEntity.fechaInhumacion;
        personaFallecido.fallecido = true;
        await this.personaRepo.save(personaFallecido);

        // Si cumple todos los requisitos, marcar hueco como ocupado y asignar fallecido
        if (allRequiredTrue) {
          const huecoNicho = await this.huecosNichoRepo.findOne({
            where: {
              id_detalle_hueco: savedEntity.id_hueco_nicho.id_detalle_hueco,
            },
          });
          if (!huecoNicho) {
            throw new NotFoundException('Hueco de nicho no encontrado');
          }
          huecoNicho.estado = 'Ocupado';
          huecoNicho.id_fallecido = savedEntity.id_fallecido;
          savedHuecoNicho = await this.huecosNichoRepo.save(huecoNicho);
        }
      }

      // Mapeo explícito de la respuesta
      return {
        ...savedEntity,
        inhumacion: savedEntity.inhumacion,
        huecoNicho: savedHuecoNicho ?? savedEntity.id_hueco_nicho,
        fallecido: personaFallecido,
        solicitante: savedEntity.id_solicitante,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al actualizar el requisito: ' + (error.message || error));
    }
  }

  /**
   * Elimina un requisito de inhumación por su ID
   */
  async remove(id: string) {
    try {
      // Buscar el requisito y su inhumación vinculada usando QueryBuilder
      const requisito = await this.repo.createQueryBuilder('requisito')
        .leftJoinAndSelect('requisito.inhumacion', 'inhumacion')
        .where('requisito.id_requsitoInhumacion = :id', { id })
        .getOne();

      if (!requisito) {
        throw new NotFoundException(`Requisito ${id} no encontrado`);
      }

      // Verifica todos los booleanos requeridos (excepto autorizacionDeMovilizacionDelCadaver)
      const allRequiredTrue =
        requisito.copiaCedula === true &&
        requisito.copiaCertificadoDefuncion === true &&
        requisito.informeEstadisticoINEC === true &&
        requisito.pagoTasaInhumacion === true &&
        requisito.copiaTituloPropiedadNicho === true &&
        requisito.OficioDeSolicitud === true;

      // Si todos los documentos están en true (excepto autorizacionDeMovilizacionDelCadaver)
      // y la inhumación está en 'Realizada', NO permitir eliminar
      if (
        allRequiredTrue &&
        requisito.inhumacion &&
        requisito.inhumacion.estado === 'Realizada'
      ) {
        throw new ConflictException(
          'No se puede eliminar el requisito porque todos los documentos están completos y la inhumación está en estado Realizada.'
        );
      }

      // Si tiene inhumación vinculada en estado 'Pendiente', eliminar en cascada la inhumación
      if (
        requisito.inhumacion &&
        requisito.inhumacion.estado === 'Pendiente'
      ) {
        await this.inhumacionRepo.createQueryBuilder()
          .delete()
          .from(Inhumacion)
          .where('id_inhumacion = :id', { id: requisito.inhumacion.id_inhumacion })
          .execute();
      }

      // Eliminar el requisito
      const res = await this.repo.createQueryBuilder()
        .delete()
        .from(RequisitosInhumacion)
        .where('id_requsitoInhumacion = :id', { id })
        .execute();

      if (!res.affected)
        throw new NotFoundException(`Requisito ${id} no encontrado`);

      return { deleted: true, id };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      throw new InternalServerErrorException('Error al eliminar el requisito: ' + (error.message || error));
    }
  }

  /**
   * Busca requisitos de inhumación por la cédula del fallecido
   */
  async findByCedulaFallecido(cedula: string) {
    try {
      const persona = await this.personaRepo
        .createQueryBuilder('persona')
        .leftJoinAndSelect('persona.requisitos_inhumacion', 'requisito')
        .leftJoinAndSelect('requisito.id_cementerio', 'req_cementerio')
        .leftJoinAndSelect('requisito.id_solicitante', 'req_solicitante')
        .leftJoinAndSelect('requisito.id_hueco_nicho', 'req_hueco_nicho')
        .leftJoinAndSelect('requisito.id_fallecido', 'req_fallecido')
        .leftJoinAndSelect('requisito.inhumacion', 'req_inhumacion')
        .leftJoinAndSelect('persona.inhumaciones', 'inhumacion')
        .where('persona.cedula = :cedula', { cedula })
        .andWhere('persona.fallecido = :fallecido', { fallecido: true })
        .getOne();

      if (!persona) {
        throw new NotFoundException(
          `Fallecido con cédula ${cedula} no encontrado`,
        );
      }

      return {
        requisitos_inhumacion: persona.requisitos_inhumacion?.map((req) => ({
          ...req,
          cementerio: req.id_cementerio,
          solicitante: req.id_solicitante,
          huecoNicho: req.id_hueco_nicho,
          fallecido: req.id_fallecido,
          inhumacion: req.inhumacion,
        })),
        inhumaciones: persona.inhumaciones,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al buscar por cédula de fallecido: ' + (error.message || error));
    }
  }

  /**
   * Busca requisitos de inhumación por la cédula del solicitante
   */
  async findByCedulaSolicitante(cedula: string) {
    try {
      const persona = await this.personaRepo
        .createQueryBuilder('persona')
        .leftJoinAndSelect('persona.requisitos_inhumacion_solicitante', 'requisito')
        .leftJoinAndSelect('requisito.id_cementerio', 'req_cementerio')
        .leftJoinAndSelect('requisito.id_solicitante', 'req_solicitante')
        .leftJoinAndSelect('requisito.id_hueco_nicho', 'req_hueco_nicho')
        .leftJoinAndSelect('requisito.id_fallecido', 'req_fallecido')
        .leftJoinAndSelect('requisito.inhumacion', 'req_inhumacion')
        .leftJoinAndSelect('persona.inhumaciones', 'inhumacion')
        .where('persona.cedula = :cedula', { cedula })
        .andWhere('persona.fallecido = :fallecido', { fallecido: false })
        .getOne();

      if (!persona) {
        throw new NotFoundException(
          `Solicitante con cédula ${cedula} no encontrado`,
        );
      }

      return {
        requisitos_inhumacion: persona.requisitos_inhumacion_solicitante?.map((req) => ({
          ...req,
          cementerio: req.id_cementerio,
          solicitante: req.id_solicitante,
          huecoNicho: req.id_hueco_nicho,
          fallecido: req.id_fallecido,
          inhumacion: req.inhumacion,
        })),
        inhumaciones: persona.inhumaciones,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al buscar por cédula de solicitante: ' + (error.message || error));
    }
  }

  /**
   * Busca nichos y huecos disponibles por cementerio, sector y fila
   */
  async findByCementerioSectorFila(
    id_cementerio: string,
    sector: string,
    fila: string,
  ) {
    try {
      const nicho = await this.nichoRepo
        .createQueryBuilder('nicho')
        .leftJoinAndSelect('nicho.huecos', 'hueco')
        .where('nicho.id_cementerio = :idCementerio', { idCementerio: id_cementerio })
        .andWhere('nicho.sector = :sector', { sector })
        .andWhere('nicho.fila = :fila', { fila })
        .getOne();

      if (!nicho) {
        throw new NotFoundException('Nicho no encontrado');
      }

      // Filtrar huecos disponibles
      const huecosDisponibles =
        nicho.huecos?.filter((h) => h.estado === 'Disponible') || [];

      return {
        ...nicho,
        huecos_disponibles: huecosDisponibles,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al buscar el nicho: ' + (error.message || error));
    }
  }

  /**
   * Busca fallecidos en requisitos de inhumación por cédula, nombres o apellidos usando búsqueda parcial
   * Normaliza el texto para ser case-insensitive y sin acentos
   */
  async findByBusquedaFallecido(busqueda: string) {
    try {
      const busquedaNormalizada = this.normalizarTexto(busqueda);
      // Búsqueda parcial por cédula, nombres o apellidos (case-insensitive)
      const personas = await this.personaRepo
        .createQueryBuilder('persona')
        .where('persona.fallecido = :fallecido', { fallecido: true })
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

      // Buscar requisitos para todas las personas encontradas
      const resultados: any[] = [];
      for (const persona of personas) {
        const requisitos = await this.repo.find({
          where: { id_fallecido: { id_persona: persona.id_persona } },
          relations: ['id_hueco_nicho', 'id_hueco_nicho.id_nicho', 'id_hueco_nicho.id_nicho.id_cementerio'],
        });
        if (requisitos && requisitos.length > 0) {
          resultados.push({
            fallecido: persona,
            requisitos: requisitos,
            nichos: requisitos.map((r) => r.id_hueco_nicho?.id_nicho),
            cementerios: requisitos.map((r) => r.id_hueco_nicho?.id_nicho?.id_cementerio),
          });
        }
      }

      if (resultados.length === 0) {
        throw new NotFoundException(
          `No se encontraron requisitos de inhumación para fallecidos que coincidan con: ${busqueda}`,
        );
      }

      return {
        termino_busqueda: busqueda,
        total_encontrados: resultados.length,
        fallecidos: resultados,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Error al buscar los requisitos de inhumación por término de búsqueda: ' + (error.message || error),
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
