import { Nicho } from './../nicho/entities/nicho.entity';
import { CreateInhumacionDto } from './dto/create-inhumaciones.dto';
import { Injectable, NotFoundException, InternalServerErrorException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inhumacion } from './entities/inhumacion.entity';
import { UpdateInhumacionDto } from './dto/update-inhumacione.dto';
import { HuecosNicho } from 'src/huecos-nichos/entities/huecos-nicho.entity';
import { Persona } from 'src/personas/entities/persona.entity';

@Injectable()
export class InhumacionesService {
  constructor(
    @InjectRepository(Inhumacion) private readonly repo: Repository<Inhumacion>,
    @InjectRepository(HuecosNicho) private readonly huecosNichoRepo: Repository<HuecosNicho>,
    @InjectRepository(Persona) private readonly personaRepo: Repository<Persona>,
    @InjectRepository(Nicho) private readonly nichoRepository: Repository<Nicho>,
  ) {}

  /**
   * Crea una nueva inhumación
   */
  async create(CreateInhumacionDto: CreateInhumacionDto) {
    try {

      // Normalizar id_fallecido si llega como string
      if (typeof CreateInhumacionDto.id_fallecido === 'string') {
        CreateInhumacionDto.id_fallecido = { id_persona: CreateInhumacionDto.id_fallecido };
      }

      // Normalizar id_nicho si llega como string
      if (typeof CreateInhumacionDto.id_nicho === 'string') {
        CreateInhumacionDto.id_nicho = { id_nicho: CreateInhumacionDto.id_nicho };
      }

      // Buscar la persona fallecida
      const personaFallecido = await this.personaRepo
        .createQueryBuilder('persona')
        .where('persona.id_persona = :id', { id: CreateInhumacionDto.id_fallecido.id_persona })
        .getOne();
      if (!personaFallecido) {
        throw new NotFoundException(
          `Fallecido con ID ${CreateInhumacionDto.id_fallecido.id_persona} no encontrado`,
        );
      }

      // Buscar el nicho
      const nicho = await this.nichoRepository
        .createQueryBuilder('nicho')
        .where('nicho.id_nicho = :id', { id: CreateInhumacionDto.id_nicho.id_nicho })
        .getOne();
      if (!nicho) {
        throw new NotFoundException(
          `Nicho con ID ${CreateInhumacionDto.id_nicho.id_nicho} no encontrado`,
        );
      }

      // Verificar si ya existe una inhumación para el fallecido
      const existeInhumacion = await this.repo
        .createQueryBuilder('inhumacion')
        .where('inhumacion.id_fallecido = :idFallecido', { idFallecido: personaFallecido.id_persona })
        .getOne();
      if (existeInhumacion) {
        throw new InternalServerErrorException(
          `Ya existe una inhumación para el fallecido con ID ${CreateInhumacionDto.id_fallecido.id_persona}`,
        );
      }

      // Verificar si el fallecido ya está enterrado en algún hueco
      const huecoOcupado = await this.huecosNichoRepo
        .createQueryBuilder('hueco')
        .where('hueco.id_fallecido = :idFallecido', { idFallecido: CreateInhumacionDto.id_fallecido.id_persona })
        .getOne();
      if (huecoOcupado) {
        throw new InternalServerErrorException(
          `El fallecido con ID ${CreateInhumacionDto.id_fallecido.id_persona} ya está enterrado en un nicho`,
        );
      }

      // Buscar huecos disponibles en el nicho
      const huecosDisponibles = await this.huecosNichoRepo
        .createQueryBuilder('hueco')
        .where('hueco.id_nicho = :idNicho', { idNicho: CreateInhumacionDto.id_nicho.id_nicho })
        .andWhere('hueco.estado = :estado', { estado: 'Disponible' })
        .getMany();

      if (!huecosDisponibles.length) {
        throw new InternalServerErrorException('No hay huecos disponibles en el nicho');
      }

      // Selecciona el primer hueco disponible
      const huecoAsignado = huecosDisponibles[0];

      // Crear la entidad de inhumación
      const inhumacion = this.repo.create(CreateInhumacionDto);

      
      // Guardar la inhumación
      const saveInhumacion = await this.repo.save(inhumacion);

      // Si la inhumación fue realizada, actualizar datos del fallecido y hueco
      if (saveInhumacion.estado == 'Realizado') {
        personaFallecido.fecha_inhumacion = new Date(CreateInhumacionDto.fecha_inhumacion);
        personaFallecido.fallecido = true; // <-- Actualiza el estado a fallecido
        await this.personaRepo.save(personaFallecido);
      }
      if (saveInhumacion.estado === 'Realizado') {
        // Marcar hueco como ocupado y asignar fallecido
        const huecoNichoActualizado = this.huecosNichoRepo.merge(huecoAsignado, {
          estado: 'Ocupado',
          id_fallecido: saveInhumacion.id_fallecido,
        });
        const savedHuecoNicho = await this.huecosNichoRepo.save(huecoNichoActualizado);

        // Mapeo explícito de la respuesta
        return {
          ...saveInhumacion,
          huecoNicho: savedHuecoNicho,
          fallecido: personaFallecido,
          nicho: nicho,
        };
      }
      // Si no fue realizada, solo retorna la inhumación y fallecido
      return {
        ...saveInhumacion,
        fallecido: personaFallecido,
        nicho: nicho,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al crear la inhumación: ' + (error.message || error));
    }
  }

  /**
   * Obtiene todas las inhumaciones
   */
  async findAll() {
    try {
      const inhumaciones = await this.repo.find({
        relations: ['id_nicho', 'id_fallecido', 'id_nicho.huecos'],
      });
      return inhumaciones.map(inh => ({
        ...inh,
        nicho: inh.id_nicho,
        fallecido: inh.id_fallecido,
        huecos: inh.id_nicho?.huecos,
      }));
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener las inhumaciones: ' + (error.message || error));
    }
  }

  /**
   * Obtiene una inhumación por su ID
   */
  async findOne(id: string) {
    try {
      const inhumacion = await this.repo.findOne({ where: { id_inhumacion: id }, relations: ['id_nicho', 'id_fallecido','id_nicho.huecos'] });
      if (!inhumacion) {
        throw new NotFoundException(`Inhumación con ID ${id} no encontrada`);
      }
      // Mapeo: separa cada objeto relacionado
      return {
        ...inhumacion,
        nicho: inhumacion.id_nicho,
        fallecido: inhumacion.id_fallecido,
        huecos: inhumacion.id_nicho?.huecos,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al buscar la inhumación: ' + (error.message || error));
    }
  }


  
  /**
   * Actualiza una inhumación por su ID
   */
  async update(id: string, updateInhumacionDto: UpdateInhumacionDto) {
    try {
      // Buscar la inhumación con relaciones usando QueryBuilder
      const inhumacion = await this.repo
        .createQueryBuilder('inhumacion')
        .leftJoinAndSelect('inhumacion.id_requisitos_inhumacion', 'requisito')
        .leftJoinAndSelect('requisito.id_hueco_nicho', 'huecoNicho')
        .leftJoinAndSelect('inhumacion.id_fallecido', 'fallecido')
        .leftJoinAndSelect('inhumacion.id_nicho', 'nicho')
        .leftJoinAndSelect('nicho.huecos', 'huecos')
        .where('inhumacion.id_inhumacion = :id', { id })
        .getOne();

      if (!inhumacion) {
        throw new NotFoundException(`Inhumación con ID ${id} no encontrada`);
      }

      this.repo.merge(inhumacion, updateInhumacionDto);
      const saveInhumacion = await this.repo.save(inhumacion);

      if (saveInhumacion.estado === 'Realizado') {
        let savedHuecoNicho: HuecosNicho | null = null;

        // Si tiene requisito y hueco asociado, actualiza ese hueco
        if (
          saveInhumacion.id_requisitos_inhumacion &&
          saveInhumacion.id_requisitos_inhumacion.id_hueco_nicho
        ) {
          const idHueco = saveInhumacion.id_requisitos_inhumacion.id_hueco_nicho.id_detalle_hueco;
          const huecoNicho = await this.huecosNichoRepo
            .createQueryBuilder('hueco')
            .where('hueco.id_detalle_hueco = :id', { id: idHueco })
            .getOne();

          if (!huecoNicho) {
            throw new NotFoundException('Hueco Nicho no encontrado');
          }

          const huecoNichoActualizado = this.huecosNichoRepo.merge(huecoNicho, {
            estado: 'Ocupado',
            id_fallecido: saveInhumacion.id_fallecido,
          });
          savedHuecoNicho = await this.huecosNichoRepo.save(huecoNichoActualizado);
        } else {
          // Si no tiene requisito, busca huecos disponibles en el nicho y ocupa el primero
          const huecosDisponibles = (inhumacion.id_nicho?.huecos || []).filter(
            (h: any) => h.estado === 'Disponible'
          );
          if (!huecosDisponibles.length) {
            throw new InternalServerErrorException('No hay huecos disponibles en el nicho');
          }
          const huecoAsignado = huecosDisponibles[0];
          const huecoNichoActualizado = this.huecosNichoRepo.merge(huecoAsignado, {
            estado: 'Ocupado',
            id_fallecido: saveInhumacion.id_fallecido,
          });
          savedHuecoNicho = await this.huecosNichoRepo.save(huecoNichoActualizado);
        }

        // Actualizar persona a fallecido
        if (inhumacion.id_fallecido) {
          inhumacion.id_fallecido.fallecido = true;
          inhumacion.id_fallecido.fecha_inhumacion = saveInhumacion.fecha_inhumacion;
          await this.personaRepo.save(inhumacion.id_fallecido);
        }

        // Mapeo explícito de la respuesta
        return {
          inhumacion: saveInhumacion,
          huecoNicho: savedHuecoNicho,
        };
      }

      // Si no fue realizada, solo retorna la inhumación
      const fallecido = await this.personaRepo.findOne({ where: { id_persona: saveInhumacion.id_fallecido?.id_persona } });

      return {
        ...saveInhumacion,
        fallecido: fallecido,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al actualizar la inhumación: ' + (error.message || error));
    }
  }

  /**
   * Elimina una inhumación por su ID
   */
  async remove(id: string) {
    try {
      // Buscar la inhumación con su requisito asociado
      const inhumacion = await this.repo.createQueryBuilder('inhumacion')
        .leftJoinAndSelect('inhumacion.id_requisitos_inhumacion', 'requisito')
        .where('inhumacion.id_inhumacion = :id', { id })
        .getOne();

      if (!inhumacion) {
        throw new NotFoundException(`Inhumación con ID ${id} no encontrada`);
      }

      // Solo permitir eliminar si la inhumación está en Pendiente
      if (inhumacion.estado !== 'Pendiente') {
        throw new ConflictException('No se puede eliminar una inhumación que ya fue realizada.');
      }

      // Si tiene requisito de inhumación, eliminarlo también
      if (inhumacion.id_requisitos_inhumacion) {
        await this.repo.manager.getRepository('RequisitosInhumacion')
          .createQueryBuilder()
          .delete()
          .where('id_requsitoInhumacion = :id', { id: inhumacion.id_requisitos_inhumacion.id_requsitoInhumacion })
          .execute();
      }

      // Eliminar la inhumación
      await this.repo.delete(id);

      return { deleted: true, id };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      throw new InternalServerErrorException('Error al eliminar la inhumación: ' + (error.message || error));
    }
  }

  /**
   * Busca inhumaciones por la cédula del fallecido
   */
  async findByCedulaFallecido(cedula: string) {
    try {
      const persona = await this.personaRepo.findOne({
        where: { cedula: cedula, fallecido: true },
        relations: [
          'huecos_nichos',
          'huecos_nichos.id_nicho',
          'huecos_nichos.id_nicho.id_cementerio',
        ],
      });
      if (!persona) {
        throw new NotFoundException(`Fallecido con cédula ${cedula} no encontrado`);
      }
      // Mapeo explícito de la respuesta
      return {
        ...persona,
        huecos: persona.huecos_nichos,
        nichos: persona.huecos_nichos?.map(h => h.id_nicho),
        cementerios: persona.huecos_nichos?.map(h => h.id_nicho?.id_cementerio),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al buscar por cédula de fallecido: ' + (error.message || error));
    }
  }

  /**
   * Busca inhumaciones por la cédula del solicitante,
   * solo si la inhumación tiene un requisito vinculado a ese solicitante.
   */
  async findByCedulaSolicitante(cedula: string) {
    try {
      // Buscar la persona solicitante por cédula
      const solicitante = await this.personaRepo.findOne({ where: { cedula } });
      if (!solicitante) {
        throw new NotFoundException(`Solicitante con cédula ${cedula} no encontrado`);
      }

      // Buscar inhumaciones con requisito vinculado al solicitante
      const inhumaciones = await this.repo
        .createQueryBuilder('inhumacion')
        .leftJoinAndSelect('inhumacion.id_requisitos_inhumacion', 'requisito')
        .leftJoinAndSelect('requisito.id_solicitante', 'solicitante')
        .leftJoinAndSelect('inhumacion.id_fallecido', 'fallecido')
        .leftJoinAndSelect('inhumacion.id_nicho', 'nicho')
        .where('requisito.id_solicitante = :idSolicitante', { idSolicitante: solicitante.id_persona })
        .getMany();

      if (!inhumaciones.length) {
        throw new NotFoundException(
          `No inhumaciones encontradas para solicitante con cédula ${cedula} vinculadas a un requisito`
        );
      }

      // Mapeo explícito de la respuesta
      return inhumaciones.map(inh => ({
        ...inh,
        requisito: inh.id_requisitos_inhumacion,
        fallecido: inh.id_fallecido,
        nicho: inh.id_nicho,
      }));
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al buscar por cédula de solicitante: ' + (error.message || error));
    }
  }

  /**
   * Busca fallecidos en inhumaciones por cédula, nombres o apellidos usando búsqueda parcial
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

      // Buscar inhumaciones para todas las personas encontradas
      const resultados: any[] = [];
      for (const persona of personas) {
        const inhumaciones = await this.repo.find({
          where: { id_fallecido: { id_persona: persona.id_persona } },
          relations: ['id_nicho', 'id_nicho.id_cementerio'],
        });
        if (inhumaciones && inhumaciones.length > 0) {
          resultados.push({
            fallecido: persona,
            inhumaciones: inhumaciones,
            nichos: inhumaciones.map((i) => i.id_nicho),
            cementerios: inhumaciones.map((i) => i.id_nicho?.id_cementerio),
          });
        }
      }

      if (resultados.length === 0) {
        throw new NotFoundException(
          `No se encontraron inhumaciones para fallecidos que coincidan con: ${busqueda}`,
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
        'Error al buscar las inhumaciones por término de búsqueda: ' + (error.message || error),
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
