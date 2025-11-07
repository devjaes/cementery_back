import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nicho } from 'src/nicho/entities/nicho.entity';
import { Inhumacion } from 'src/inhumaciones/entities/inhumacion.entity';
import { CreateExhumacionDto } from './dto/create-exhumacion.dto';
import { UpdateExhumacionDto } from './dto/update-exhumacion.dto';
import { Exhumacion, EstadoExhumacion } from './entities/exhumacion.entity';

@Injectable()
export class ExhumacionService {
  constructor(
    @InjectRepository(Exhumacion)
    private readonly exhumacionRepository: Repository<Exhumacion>,
    @InjectRepository(Nicho)
    private readonly nichoRepository: Repository<Nicho>,
    @InjectRepository(Inhumacion)
    private readonly inhumacionRepository: Repository<Inhumacion>,
  ) {}

  // Crear nueva exhumación (con archivos opcionales)
  async create(
    createDto: CreateExhumacionDto,
    archivos?: Express.Multer.File[],
  ) {
    try {
      const nichoOriginal = await this.nichoRepository.findOne({
        where: { id_nicho: createDto.nicho_original_id },
      });
      if (!nichoOriginal)
        throw new NotFoundException('Nicho original no encontrado');

      const inhumacion = await this.inhumacionRepository.findOne({
        where: { id_inhumacion: createDto.inhumacion_id },
      });
      if (!inhumacion)
        throw new NotFoundException('Inhumación no encontrada');

      const codigo = this.generarCodigoExhumacion();

      const exhumacion = this.exhumacionRepository.create({
        ...createDto,
        archivos: archivos?.[0]?.buffer || null, // Guarda archivo real (primer archivo)
        estado_pago: EstadoExhumacion.PENDIENTE,
        codigo,
        nichoOriginal,
        inhumacion,
      });

      return await this.exhumacionRepository.save(exhumacion);
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al crear la exhumación: ' + (error.message || error),
      );
    }
  }

  //  Actualizar exhumación (incluye comprobante de pago)
  // async update(id: string, updateDto: UpdateExhumacionDto) {
  //   const exhumacion = await this.exhumacionRepository.findOne({
  //     where: { id_exhumacion: id },
  //   });
  //   if (!exhumacion) throw new NotFoundException('Exhumación no encontrada');

  //   if (updateDto.comprobante_pago) {
  //     const archivo =
  //       Array.isArray(updateDto.comprobante_pago) &&
  //       updateDto.comprobante_pago[0] &&
  //       (updateDto.comprobante_pago[0] as any).buffer
  //         ? (updateDto.comprobante_pago[0] as any).buffer
  //         : Buffer.from(updateDto.comprobante_pago as string, 'base64');

  //     exhumacion.comprobante_pago = archivo;
  //     exhumacion.estado_pago = EstadoExhumacion.FINALIZADO;
  //   }

  //   Object.assign(exhumacion, updateDto);
  //   return await this.exhumacionRepository.save(exhumacion);
  // }


  async update(
  id: string, 
  updateDto: UpdateExhumacionDto,
  comprobante?: Express.Multer.File[] // ← AGREGAR ESTO
) {
  const exhumacion = await this.exhumacionRepository.findOne({
    where: { id_exhumacion: id },
  });
  if (!exhumacion) throw new NotFoundException('Exhumación no encontrada');

  if (comprobante && comprobante[0]) { // ← MANEJAR EL ARCHIVO
    exhumacion.comprobante_pago = comprobante[0].buffer;
    exhumacion.estado_pago = EstadoExhumacion.FINALIZADO;
  }

  Object.assign(exhumacion, updateDto);
  return await this.exhumacionRepository.save(exhumacion);
}

  //  Obtener todas las exhumaciones
  async findAll() {
    return this.exhumacionRepository.find({
      relations: ['nichoOriginal', 'inhumacion'],
    });
  }

  //  Obtener una exhumación por ID
  async findOne(id: string) {
    const exhumacion = await this.exhumacionRepository.findOne({
      where: { id_exhumacion: id },
      relations: ['nichoOriginal', 'inhumacion'],
    });
    if (!exhumacion) throw new NotFoundException('Exhumación no encontrada');
    return exhumacion;
  }

  //  Buscar exhumaciones por cédula del fallecido
  async findByCedula(cedula: string) {
    const exhumaciones = await this.exhumacionRepository
      .createQueryBuilder('ex')
      .leftJoinAndSelect('ex.inhumacion', 'inh')
      .leftJoinAndSelect('inh.id_fallecido', 'per')
      .where('per.cedula = :cedula', { cedula })
      .getMany();

    if (!exhumaciones.length)
      throw new NotFoundException(
        'No se encontraron exhumaciones para esa cédula',
      );
    return exhumaciones;
  }

  //  Eliminar una exhumación
  async remove(id: string) {
    const exhumacion = await this.findOne(id);
    return this.exhumacionRepository.remove(exhumacion);
  }

  //  Generar código único para exhumación
  private generarCodigoExhumacion(): string {
    const now = new Date();
    return `${Math.floor(100 + Math.random() * 900)}-${now.getFullYear()}-EXH`;
  }
}
