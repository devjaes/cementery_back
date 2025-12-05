import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropietarioNicho } from '../propietarios-nichos/entities/propietarios-nicho.entity';
import { Inhumacion } from '../inhumaciones/entities/inhumacion.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(PropietarioNicho)
    private readonly propietarioNichoRepository: Repository<PropietarioNicho>,
    @InjectRepository(Inhumacion)
    private readonly inhumacionRepository: Repository<Inhumacion>,
  ) {}

  async getOwners(cedula?: string) {
    const query = this.propietarioNichoRepository
      .createQueryBuilder('propietario')
      .leftJoinAndSelect('propietario.id_persona', 'persona')
      .leftJoinAndSelect('propietario.id_nicho', 'nicho')
      .leftJoinAndSelect('nicho.id_bloque', 'bloque');

    if (cedula) {
      query.where('persona.cedula LIKE :cedula', { cedula: `%${cedula}%` });
    }

    return query.getMany();
  }

  async getDeceased(filters: {
    startDate?: string;
    endDate?: string;
    nicheId?: string;
    cause?: string;
    cedula?: string;
  }) {
    const query = this.inhumacionRepository
      .createQueryBuilder('inhumacion')
      .leftJoinAndSelect('inhumacion.id_fallecido', 'fallecido')
      .leftJoinAndSelect('inhumacion.id_nicho', 'nicho')
      .leftJoinAndSelect('nicho.id_bloque', 'bloque');

    if (filters.startDate) {
      query.andWhere('inhumacion.fecha_inhumacion >= :startDate', {
        startDate: filters.startDate,
      });
    }
    if (filters.endDate) {
      query.andWhere('inhumacion.fecha_inhumacion <= :endDate', {
        endDate: filters.endDate,
      });
    }
    if (filters.nicheId) {
      query.andWhere('nicho.id_nicho = :nicheId', { nicheId: filters.nicheId });
    }
    if (filters.cause) {
      query.andWhere('fallecido.causa_defuncion ILIKE :cause', {
        cause: `%${filters.cause}%`,
      });
    }
    if (filters.cedula) {
      query.andWhere('fallecido.cedula LIKE :cedula', {
        cedula: `%${filters.cedula}%`,
      });
    }

    return query.getMany();
  }
}
