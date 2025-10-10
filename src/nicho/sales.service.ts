import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nicho } from './entities/nicho.entity';
import { ReservarNichoDto } from './dto/reservar-nicho.dto';
import { ConfirmarVentaNichoDto } from './dto/confirmar-venta-nicho.dto';
import { HuecosNicho } from 'src/huecos-nichos/entities/huecos-nicho.entity';
import { Persona } from 'src/personas/entities/persona.entity';
import { PropietarioNicho } from 'src/propietarios-nichos/entities/propietarios-nicho.entity';
import { EstadoNicho } from './enum/estadoNicho.enum';
import { PaymentService } from 'src/payment/payment.service';
import { PropietariosNichosService } from 'src/propietarios-nichos/propietarios-nichos.service';
import { TipoPropietario } from 'src/propietarios-nichos/dto/create-propietarios-nicho.dto';

@Injectable()
export class NicheSalesService {
  constructor(
    @InjectRepository(Nicho)
    private readonly nichoRepository: Repository<Nicho>,
    @InjectRepository(HuecosNicho)
    private readonly huecosNichoRepository: Repository<HuecosNicho>,
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    @InjectRepository(PropietarioNicho)
    private readonly nichoPropietarioRepository: Repository<PropietarioNicho>,
    private readonly paymentService: PaymentService,
    private readonly propietariosNichosService: PropietariosNichosService,
  ) { }



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
   * Reserva un nicho para un cliente y crea la orden de pago
   * @param reservarNichoDto Datos para reservar el nicho
   * @returns Objeto con información del nicho reservado y la orden de pago
   */
  async reservarNicho(reservarNichoDto: ReservarNichoDto) {
    try {
      // 1. Verificar que el nicho existe y está disponible
      const nicho = await this.nichoRepository.findOne({
        where: { id_nicho: reservarNichoDto.idNicho },
        relations: ['id_cementerio'],
      });

      if (!nicho) {
        throw new NotFoundException(
          `Nicho con ID ${reservarNichoDto.idNicho} no encontrado`,
        );
      }

      if (nicho.estadoVenta !== EstadoNicho.DISPONIBLE) {
        throw new BadRequestException(
          `El nicho no está disponible para reserva. Estado actual: ${nicho.estadoVenta}`,
        );
      }

      // 2. Verificar que la persona existe
      const persona = await this.personaRepository.findOne({
        where: { id_persona: reservarNichoDto.idPersona },
      });

      if (!persona) {
        throw new NotFoundException(
          `Persona con ID ${reservarNichoDto.idPersona} no encontrada`,
        );
      }

      // 3. Verificar que la persona no está fallecida
      if (persona.fallecido === true) {
        throw new BadRequestException(
          'No se puede asignar un nicho a una persona fallecida',
        );
      }

      // 4. Cambiar estado del nicho a RESERVADO
      nicho.estadoVenta = EstadoNicho.RESERVADO;
      await this.nichoRepository.save(nicho);

      // 5. Crear orden de pago
      const ordenPago = await this.paymentService.create({
        procedureType: 'niche_sale',
        procedureId: nicho.id_nicho,
        amount: reservarNichoDto.monto,
        generatedBy: reservarNichoDto.generadoPor,
        observations: reservarNichoDto.observaciones,
      });

      return {
        nicho: {
          id: nicho.id_nicho,
          sector: nicho.sector,
          fila: nicho.fila,
          numero: nicho.numero,
          estado: nicho.estadoVenta,
          cementerio: nicho.id_cementerio.nombre,
        },
        cliente: {
          id: persona.id_persona,
          nombres: persona.nombres,
          apellidos: persona.apellidos,
          cedula: persona.cedula,
        },
        ordenPago: {
          id: ordenPago.paymentId,
          codigo: ordenPago.paymentCode,
          monto: ordenPago.amount,
          estado: ordenPago.status,
          fechaGeneracion: ordenPago.generatedDate,
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
        'Error interno al reservar el nicho',
      );
    }
  }

  /**
   * Confirma la venta del nicho después de que finanzas aprueba el pago
   * @param confirmarVentaDto Datos para confirmar la venta
   * @returns Información de la venta confirmada
   */
  async confirmarVentaNicho(confirmarVentaDto: ConfirmarVentaNichoDto) {
    try {
      // 1. Obtener información del pago
      const pago = await this.paymentService.findOne(confirmarVentaDto.idPago);

      if (pago.status === 'paid') {
        throw new BadRequestException('Este pago ya ha sido confirmado');
      }

      if (pago.procedureType !== 'niche_sale') {
        throw new BadRequestException(
          'El pago no corresponde a una venta de nicho',
        );
      }

      // 2. Obtener el nicho asociado al pago
      const nicho = await this.nichoRepository.findOne({
        where: { id_nicho: pago.procedureId },
        relations: ['id_cementerio'],
      });

      if (!nicho) {
        throw new NotFoundException(
          `Nicho con ID ${pago.procedureId} no encontrado`,
        );
      }

      if (nicho.estadoVenta !== EstadoNicho.RESERVADO) {
        throw new BadRequestException(
          `El nicho debe estar en estado RESERVADO para confirmar la venta. Estado actual: ${nicho.estadoVenta}`,
        );
      }

      // 3. Confirmar el pago
      const pagoConfirmado = await this.paymentService.confirmPayment(
        confirmarVentaDto.idPago,
        confirmarVentaDto.validadoPor,
        confirmarVentaDto.archivoRecibo,
      );

      // 4. Cambiar estado del nicho a VENDIDO
      nicho.estadoVenta = EstadoNicho.VENDIDO;
      const nichoVendido = await this.nichoRepository.save(nicho);

      return {
        nicho: {
          id: nichoVendido.id_nicho,
          sector: nichoVendido.sector,
          fila: nichoVendido.fila,
          numero: nichoVendido.numero,
          estado: nichoVendido.estadoVenta,
          cementerio: nichoVendido.id_cementerio.nombre,
        },
        pago: {
          id: pagoConfirmado.paymentId,
          codigo: pagoConfirmado.paymentCode,
          monto: pagoConfirmado.amount,
          estado: pagoConfirmado.status,
          fechaPago: pagoConfirmado.paidDate,
          validadoPor: pagoConfirmado.validatedBy,
        },
        siguientePaso: {
          accion: 'crear_propietario',
          mensaje: 'Ahora debe registrar al propietario del nicho',
          datos: {
            idNicho: nichoVendido.id_nicho,
            idPago: pagoConfirmado.paymentId,
          },
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
        'Error interno al confirmar la venta del nicho',
      );
    }
  }

  /**
   * Registra al propietario del nicho después de confirmar la venta
   * @param idNicho ID del nicho vendido
   * @param idPersona ID de la persona que será propietaria
   * @param tipoDocumento Tipo de documento del propietario
   * @param numeroDocumento Número de documento del propietario
   * @param razon Razón de la adquisición
   * @returns Información del propietario registrado
   */
  async registrarPropietarioNicho(
    idNicho: string,
    idPersona: string,
    tipoDocumento: string,
    numeroDocumento: string,
    razon: string = 'Compra de nicho',
  ) {
    try {
      // 1. Verificar que el nicho esté vendido
      const nicho = await this.nichoRepository.findOne({
        where: { id_nicho: idNicho },
      });

      if (!nicho) {
        throw new NotFoundException(`Nicho con ID ${idNicho} no encontrado`);
      }

      if (nicho.estadoVenta !== EstadoNicho.VENDIDO) {
        throw new BadRequestException(
          `El nicho debe estar en estado VENDIDO para registrar propietario. Estado actual: ${nicho.estadoVenta}`,
        );
      }

      // 2. Verificar que no tenga propietario activo
      const propietarioActivo = await this.nichoPropietarioRepository.findOne({
        where: {
          id_nicho: { id_nicho: idNicho },
          activo: true,
        },
      });

      if (propietarioActivo) {
        throw new BadRequestException(
          'El nicho ya tiene un propietario activo',
        );
      }

      // 3. Crear el propietario
      const propietario = await this.propietariosNichosService.create({
        id_persona: { id_persona: idPersona },
        id_nicho: { id_nicho: idNicho },
        fecha_adquisicion: new Date(),
        tipo_documento: tipoDocumento,
        numero_documento: numeroDocumento,
        activo: true,
        razon: razon,
        tipo: TipoPropietario.Dueño,
      });

      return {
        propietario: {
          id: propietario.id_propietario_nicho,
          persona: propietario.id_persona,
          nicho: propietario.id_nicho,
          fechaAdquisicion: propietario.fecha_adquisicion,
          tipo: propietario.tipo,
          activo: propietario.activo,
        },
        mensaje: 'Propietario registrado exitosamente',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error interno al registrar el propietario del nicho',
      );
    }
  }

  /**
   * Obtiene el historial de ventas de nichos
   * @param filtros Filtros opcionales para la consulta
   * @returns Lista de ventas de nichos
   */
  async obtenerHistorialVentas(filtros?: {
    estado?: EstadoNicho;
    fechaDesde?: Date;
    fechaHasta?: Date;
    cementerio?: string;
    sector?: string;
  }) {
    try {
      const query = this.nichoRepository
        .createQueryBuilder('nicho')
        .leftJoinAndSelect('nicho.id_cementerio', 'cementerio')
        .leftJoinAndSelect('nicho.propietarios_nicho', 'propietario', 'propietario.activo = :activo', { activo: true })
        .leftJoinAndSelect('propietario.id_persona', 'persona')
        .where('nicho.estadoVenta IN (:...estados)', {
          estados: [EstadoNicho.RESERVADO, EstadoNicho.VENDIDO],
        });

      if (filtros?.estado) {
        query.andWhere('nicho.estadoVenta = :estado', {
          estado: filtros.estado,
        });
      }

      if (filtros?.cementerio) {
        query.andWhere('cementerio.id_cementerio = :cementerio', {
          cementerio: filtros.cementerio,
        });
      }

      if (filtros?.sector) {
        query.andWhere('nicho.sector = :sector', { sector: filtros.sector });
      }

      query.orderBy('nicho.fecha_actualizacion', 'DESC');

      const nichos = await query.getMany();

      // Obtener información de pagos para cada nicho
      const ventasConPagos = await Promise.all(
        nichos.map(async (nicho) => {
          const pagos = await this.paymentService.findByProcedure(
            'niche_sale',
            nicho.id_nicho,
          );

          return {
            nicho: {
              id: nicho.id_nicho,
              sector: nicho.sector,
              fila: nicho.fila,
              numero: nicho.numero,
              estado: nicho.estadoVenta,
              cementerio: nicho.id_cementerio.nombre,
            },
            propietario: nicho.propietarios_nicho[0]
              ? {
                  id: nicho.propietarios_nicho[0].id_persona.id_persona,
                  nombres: nicho.propietarios_nicho[0].id_persona.nombres,
                  apellidos: nicho.propietarios_nicho[0].id_persona.apellidos,
                  cedula: nicho.propietarios_nicho[0].id_persona.cedula,
                  fechaAdquisicion:
                    nicho.propietarios_nicho[0].fecha_adquisicion,
                }
              : null,
            pagos: pagos.map((pago) => ({
              id: pago.paymentId,
              codigo: pago.paymentCode,
              monto: pago.amount,
              estado: pago.status,
              fechaGeneracion: pago.generatedDate,
              fechaPago: pago.paidDate,
            })),
          };
        }),
      );

      return ventasConPagos;
    } catch (error) {
      throw new InternalServerErrorException(
        'Error interno al obtener el historial de ventas',
      );
    }
  }

  /**
   * Cancela una reserva de nicho (solo si el pago no ha sido confirmado)
   * @param idNicho ID del nicho a cancelar
   * @param motivo Motivo de la cancelación
   * @returns Información de la cancelación
   */
  async cancelarReservaNicho(idNicho: string, motivo: string) {
    try {
      // 1. Verificar que el nicho existe y está reservado
      const nicho = await this.nichoRepository.findOne({
        where: { id_nicho: idNicho },
      });

      if (!nicho) {
        throw new NotFoundException(`Nicho con ID ${idNicho} no encontrado`);
      }

      if (nicho.estadoVenta !== EstadoNicho.RESERVADO) {
        throw new BadRequestException(
          `Solo se pueden cancelar nichos en estado RESERVADO. Estado actual: ${nicho.estadoVenta}`,
        );
      }

      // 2. Buscar pagos pendientes asociados al nicho
      const pagosPendientes = await this.paymentService.findByProcedure(
        'niche_sale',
        idNicho,
      );

      const pagoPendiente = pagosPendientes.find(
        (pago) => pago.status === 'pending',
      );

      if (!pagoPendiente) {
        throw new BadRequestException(
          'No se puede cancelar la reserva: no hay pagos pendientes',
        );
      }

      // 3. Eliminar el pago pendiente
      await this.paymentService.remove(pagoPendiente.paymentId);

      // 4. Cambiar estado del nicho a DISPONIBLE
      nicho.estadoVenta = EstadoNicho.DISPONIBLE;
      await this.nichoRepository.save(nicho);

      return {
        nicho: {
          id: nicho.id_nicho,
          sector: nicho.sector,
          fila: nicho.fila,
          numero: nicho.numero,
          estado: nicho.estadoVenta,
        },
        mensaje: 'Reserva cancelada exitosamente',
        motivo: motivo,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error interno al cancelar la reserva del nicho',
      );
    }
  }
}
