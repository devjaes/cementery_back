import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Equal } from 'typeorm';
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
import { Bloque } from 'src/bloques/entities/bloque.entity';

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
    @InjectRepository(Bloque)
    private readonly bloqueRepository: Repository<Bloque>,
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
   * Si el nicho pertenece a un mausoleo, reserva todos los nichos del bloque
   * @param reservarNichoDto Datos para reservar el nicho
   * @returns Objeto con información del nicho reservado y la orden de pago
   */
  async reservarNicho(reservarNichoDto: ReservarNichoDto) {
    try {
      // 1. Verificar que el nicho existe y está disponible, cargar bloque
      const nicho = await this.nichoRepository.findOne({
        where: { id_nicho: reservarNichoDto.idNicho },
        relations: ['id_cementerio', 'id_bloque'],
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

      // 4. Verificar si es un mausoleo y obtener todos los nichos a reservar
      const esMausoleo = nicho.id_bloque && nicho.id_bloque.tipo_bloque === 'Mausoleo';
      let nichosAReservar: Nicho[] = [nicho];
      
      if (esMausoleo) {
        // Obtener todos los nichos del mausoleo
        nichosAReservar = await this.nichoRepository.find({
          where: { 
            id_bloque: Equal(nicho.id_bloque.id_bloque)
          },
          relations: ['id_cementerio', 'id_bloque'],
        });

        // Validar que TODOS los nichos estén disponibles
        const nichoNoDisponible = nichosAReservar.find(
          n => n.estadoVenta !== EstadoNicho.DISPONIBLE
        );
        
        if (nichoNoDisponible) {
          throw new BadRequestException(
            `No se puede reservar el mausoleo. El nicho ${nichoNoDisponible.fila}-${nichoNoDisponible.columna} está en estado: ${nichoNoDisponible.estadoVenta}`,
          );
        }
      }

      // 5. Cambiar estado de todos los nichos a RESERVADO
      for (const nichoAReservar of nichosAReservar) {
        nichoAReservar.estadoVenta = EstadoNicho.RESERVADO;
        await this.nichoRepository.save(nichoAReservar);
      }

      // 6. Crear orden de pago
      const descripcionProcedimiento = esMausoleo 
        ? `Venta de mausoleo ${nicho.id_bloque.nombre} (${nichosAReservar.length} nichos)`
        : `Venta de nicho ${nicho.fila}-${nicho.columna}`;

      const ordenPago = await this.paymentService.create({
        procedureType: 'niche_sale',
        procedureId: nicho.id_nicho,
        amount: reservarNichoDto.monto,
        generatedBy: reservarNichoDto.generadoPor,
        observations: esMausoleo 
          ? `${reservarNichoDto.observaciones || ''} - Mausoleo completo con ${nichosAReservar.length} nichos`.trim()
          : reservarNichoDto.observaciones,
        buyerDocument: persona.cedula,
        buyerName: `${persona.nombres} ${persona.apellidos}`,
        buyerDirection: reservarNichoDto.direccionComprador || 'Sin dirección',
      });

      return {
        nicho: {
          id: nicho.id_nicho,
          fila: nicho.fila,
          columna: nicho.columna,
          estado: nicho.estadoVenta,
          cementerio: nicho.id_cementerio.nombre,
          ...(esMausoleo && {
            mausoleo: {
              nombre: nicho.id_bloque.nombre,
              totalNichos: nichosAReservar.length,
              nichosReservados: nichosAReservar.map(n => ({
                id: n.id_nicho,
                fila: n.fila,
                columna: n.columna,
              })),
            },
          }),
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
          comprador: {
            documento: ordenPago.buyerDocument,
            nombre: ordenPago.buyerName,
            direccion: ordenPago.buyerDirection,
          },
        },
        ...(esMausoleo && {
          mensaje: `Se han reservado ${nichosAReservar.length} nichos del mausoleo ${nicho.id_bloque.nombre}`,
        }),
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
   * Si el nicho pertenece a un mausoleo, confirma la venta de todos los nichos del bloque
   * @param confirmarVentaDto Datos para confirmar la venta
   * @returns Información de la venta confirmada
   */
async confirmarVentaNicho(confirmarVentaDto: ConfirmarVentaNichoDto) {
  try {
    // 1. Obtener información del pago
    const pago = await this.paymentService.findOne(confirmarVentaDto.idPago);

    if (pago.procedureType !== 'niche_sale') {
      throw new BadRequestException('El pago no corresponde a una venta de nicho');
    }

    // 2. Obtener el nicho asociado al pago, cargar bloque
    const nicho = await this.nichoRepository.findOne({
      where: { id_nicho: pago.procedureId },
      relations: ['id_cementerio', 'id_bloque'],
    });

    if (!nicho) {
      throw new NotFoundException(`Nicho con ID ${pago.procedureId} no encontrado`);
    }

    // 3. Verificar si es un mausoleo y obtener todos los nichos a confirmar
    const esMausoleo = nicho.id_bloque && nicho.id_bloque.tipo_bloque === 'Mausoleo';
    let nichosAConfirmar: Nicho[] = [nicho];
    
    if (esMausoleo) {
      // Obtener todos los nichos del mausoleo
      nichosAConfirmar = await this.nichoRepository.find({
        where: { 
          id_bloque: Equal(nicho.id_bloque.id_bloque)
        },
        relations: ['id_cementerio', 'id_bloque'],
      });
    }

    // 4. Si el nicho ya está VENDIDO, devolvemos éxito idempotente con la info actual
    if (nicho.estadoVenta === EstadoNicho.VENDIDO) {
      const pagoInfo = await this.paymentService.findOne(confirmarVentaDto.idPago); // refrescar pago
      return {
        nicho: {
          id: nicho.id_nicho,
          fila: nicho.fila,
          columna: nicho.columna,
          estado: nicho.estadoVenta,
          cementerio: nicho.id_cementerio.nombre,
          ...(esMausoleo && {
            mausoleo: {
              nombre: nicho.id_bloque.nombre,
              totalNichos: nichosAConfirmar.length,
              nichosVendidos: nichosAConfirmar.map(n => ({
                id: n.id_nicho,
                fila: n.fila,
                columna: n.columna,
                estado: n.estadoVenta,
              })),
            },
          }),
        },
        pago: {
          id: pagoInfo.paymentId,
          codigo: pagoInfo.paymentCode,
          monto: pagoInfo.amount,
          estado: pagoInfo.status,
          fechaPago: pagoInfo.paidDate,
          validadoPor: pagoInfo.validatedBy,
          comprador: {
            documento: pagoInfo.buyerDocument,
            nombre: pagoInfo.buyerName,
            direccion: pagoInfo.buyerDirection,
          },
        },
        siguientePaso: {
          accion: 'crear_propietario',
          mensaje: esMausoleo 
            ? `El mausoleo ya está marcado como VENDIDO (${nichosAConfirmar.length} nichos)`
            : 'El nicho ya está marcado como VENDIDO',
          datos: {
            idNicho: nicho.id_nicho,
            idPago: pagoInfo.paymentId,
          },
        },
      };
    }

    // 5. Si el nicho no está RESERVADO, rechazamos (permite sólo RESERVADO -> VENDIDO)
    if (nicho.estadoVenta !== EstadoNicho.RESERVADO) {
      throw new BadRequestException(
        `El nicho debe estar en estado RESERVADO para confirmar la venta. Estado actual: ${nicho.estadoVenta}`,
      );
    }

    // Si es mausoleo, verificar que TODOS estén RESERVADOS
    if (esMausoleo) {
      const nichoNoReservado = nichosAConfirmar.find(
        n => n.estadoVenta !== EstadoNicho.RESERVADO
      );
      
      if (nichoNoReservado) {
        throw new BadRequestException(
          `No se puede confirmar la venta del mausoleo. El nicho ${nichoNoReservado.fila}-${nichoNoReservado.columna} está en estado: ${nichoNoReservado.estadoVenta}`,
        );
      }
    }

    // 6. Confirmar el pago si está pendiente, si ya es 'paid' lo reutilizamos
    let pagoConfirmado;
    if (pago.status === 'paid') {
      // no volver a confirmar, usar el pago existente
      pagoConfirmado = pago;
    } else {
      pagoConfirmado = await this.paymentService.confirmPayment(
        confirmarVentaDto.idPago,
        confirmarVentaDto.validadoPor,
        confirmarVentaDto.archivoRecibo,
      );
    }

    // 7. Cambiar estado de todos los nichos a VENDIDO
    for (const nichoAConfirmar of nichosAConfirmar) {
      nichoAConfirmar.estadoVenta = EstadoNicho.VENDIDO;
      await this.nichoRepository.save(nichoAConfirmar);
    }

    const nichoVendido = nicho; // El nicho principal para la respuesta

    return {
      nicho: {
        id: nichoVendido.id_nicho,
        fila: nichoVendido.fila,
        columna: nichoVendido.columna,
        estado: nichoVendido.estadoVenta,
        cementerio: nichoVendido.id_cementerio.nombre,
        ...(esMausoleo && {
          mausoleo: {
            nombre: nicho.id_bloque.nombre,
            totalNichos: nichosAConfirmar.length,
            nichosVendidos: nichosAConfirmar.map(n => ({
              id: n.id_nicho,
              fila: n.fila,
              columna: n.columna,
            })),
          },
        }),
      },
      pago: {
        id: pagoConfirmado.paymentId,
        codigo: pagoConfirmado.paymentCode,
        monto: pagoConfirmado.amount,
        estado: pagoConfirmado.status,
        fechaPago: pagoConfirmado.paidDate,
        validadoPor: pagoConfirmado.validatedBy,
        comprador: {
          documento: pagoConfirmado.buyerDocument,
          nombre: pagoConfirmado.buyerName,
          direccion: pagoConfirmado.buyerDirection,
        },
      },
      siguientePaso: {
        accion: 'crear_propietario',
        mensaje: esMausoleo 
          ? `Ahora debe registrar al propietario del mausoleo (${nichosAConfirmar.length} nichos vendidos)`
          : 'Ahora debe registrar al propietario del nicho',
        datos: {
          idNicho: nichoVendido.id_nicho,
          idPago: pagoConfirmado.paymentId,
          ...(esMausoleo && { totalNichosVendidos: nichosAConfirmar.length }),
        },
      },
      ...(esMausoleo && {
        mensaje: `Se confirmó la venta de ${nichosAConfirmar.length} nichos del mausoleo ${nicho.id_bloque.nombre}`,
      }),
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
   * Si el nicho pertenece a un mausoleo, crea propietarios para todos los nichos del mausoleo
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
      // 1. Verificar que el nicho esté vendido y obtener información del bloque
      const nicho = await this.nichoRepository.findOne({
        where: { id_nicho: idNicho },
        relations: ['id_bloque'],
      });

      if (!nicho) {
        throw new NotFoundException(`Nicho con ID ${idNicho} no encontrado`);
      }

      if (nicho.estadoVenta !== EstadoNicho.VENDIDO) {
        throw new BadRequestException(
          `El nicho debe estar en estado VENDIDO para registrar propietario. Estado actual: ${nicho.estadoVenta}`,
        );
      }

      // Determinar si es un mausoleo
      const esMausoleo = nicho.id_bloque && nicho.id_bloque.tipo_bloque === 'Mausoleo';

      // 2. Si es mausoleo, obtener todos los nichos del bloque
      let nichosARegistrar: Nicho[] = [nicho];
      if (esMausoleo) {
        nichosARegistrar = await this.nichoRepository.find({
          where: { id_bloque: Equal(nicho.id_bloque.id_bloque) },
          order: { fila: 'ASC', columna: 'ASC' },
        });

        // Verificar que todos los nichos estén VENDIDOS
        const nichoNoVendido = nichosARegistrar.find(
          n => n.estadoVenta !== EstadoNicho.VENDIDO
        );
        
        if (nichoNoVendido) {
          throw new BadRequestException(
            `No se puede registrar propietario del mausoleo. El nicho ${nichoNoVendido.fila}-${nichoNoVendido.columna} está en estado: ${nichoNoVendido.estadoVenta}`,
          );
        }
      }

      // 3. Verificar que ninguno de los nichos tenga propietario activo
      for (const nichoARegistrar of nichosARegistrar) {
        const propietarioActivo = await this.nichoPropietarioRepository.findOne({
          where: {
            id_nicho: { id_nicho: nichoARegistrar.id_nicho },
            activo: true,
          },
        });

        if (propietarioActivo) {
          throw new BadRequestException(
            esMausoleo
              ? `El nicho ${nichoARegistrar.fila}-${nichoARegistrar.columna} del mausoleo ya tiene un propietario activo`
              : 'El nicho ya tiene un propietario activo',
          );
        }
      }

      // 4. Crear propietarios para todos los nichos
      const propietariosCreados: Array<{
        id: string;
        nicho: {
          id: string;
          fila: number;
          columna: number;
        };
        fechaAdquisicion: Date;
        tipo: string;
        activo: boolean;
      }> = [];
      const fechaAdquisicion = new Date();

      for (const nichoARegistrar of nichosARegistrar) {
        const propietario = await this.propietariosNichosService.create({
          id_persona: { id_persona: idPersona },
          id_nicho: { id_nicho: nichoARegistrar.id_nicho },
          fecha_adquisicion: fechaAdquisicion,
          tipo_documento: tipoDocumento,
          numero_documento: numeroDocumento,
          activo: true,
          razon: razon,
          tipo: TipoPropietario.Dueño,
        });

        propietariosCreados.push({
          id: propietario.id_propietario_nicho,
          nicho: {
            id: nichoARegistrar.id_nicho,
            fila: nichoARegistrar.fila,
            columna: nichoARegistrar.columna,
          },
          fechaAdquisicion: propietario.fecha_adquisicion,
          tipo: propietario.tipo,
          activo: propietario.activo,
        });
      }

      return {
        propietario: {
          id: propietariosCreados[0].id,
          persona: idPersona,
          nicho: propietariosCreados[0].nicho,
          fechaAdquisicion: fechaAdquisicion,
          tipo: TipoPropietario.Dueño,
          activo: true,
        },
        ...(esMausoleo && {
          mausoleo: {
            nombre: nicho.id_bloque.nombre,
            totalNichos: propietariosCreados.length,
            propietarios: propietariosCreados,
          },
        }),
        mensaje: esMausoleo
          ? `Propietario registrado exitosamente para ${propietariosCreados.length} nichos del mausoleo ${nicho.id_bloque.nombre}`
          : 'Propietario registrado exitosamente',
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
              fila: nicho.fila,
              columna: nicho.columna,
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
              comprador: {
                documento: pago.buyerDocument,
                nombre: pago.buyerName,
                direccion: pago.buyerDirection,
              },
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
          fila: nicho.fila,
          columna: nicho.columna,
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

  /**
   * Cancela una reserva de mausoleo completo (solo si el pago no ha sido confirmado)
   * @param idBloque ID del bloque (mausoleo) a cancelar
   * @param motivo Motivo de la cancelación
   * @returns Información de la cancelación
   */
  async cancelarReservaMausoleo(idBloque: string, motivo: string) {
    try {
      // 1. Verificar que el bloque existe y es de tipo Mausoleo
      const bloque = await this.bloqueRepository.findOne({
        where: { id_bloque: idBloque },
        relations: ['cementerio'],
      });

      if (!bloque) {
        throw new NotFoundException(`Bloque con ID ${idBloque} no encontrado`);
      }

      if (bloque.tipo_bloque !== 'Mausoleo') {
        throw new BadRequestException(
          `El bloque "${bloque.nombre}" no es de tipo Mausoleo. Tipo actual: ${bloque.tipo_bloque}`,
        );
      }

      // 2. Obtener todos los nichos del mausoleo
      const nichos = await this.nichoRepository.find({
        where: { id_bloque: Equal(idBloque) },
        order: { fila: 'ASC', columna: 'ASC' },
      });

      if (nichos.length === 0) {
        throw new NotFoundException(
          `No se encontraron nichos para el mausoleo "${bloque.nombre}"`,
        );
      }

      // 3. Verificar que todos los nichos están RESERVADOS
      const nichosNoReservados = nichos.filter(
        (nicho) => nicho.estadoVenta !== EstadoNicho.RESERVADO,
      );

      if (nichosNoReservados.length > 0) {
        throw new BadRequestException(
          `No se puede cancelar: ${nichosNoReservados.length} nicho(s) del mausoleo no están en estado RESERVADO`,
        );
      }

      // 4. Buscar el pago pendiente del mausoleo
      const pagosPendientes = await this.paymentService.findByProcedure(
        'mausoleum_sale',
        idBloque,
      );

      const pagoPendiente = pagosPendientes.find(
        (pago) => pago.status === 'pending',
      );

      if (!pagoPendiente) {
        throw new BadRequestException(
          'No se puede cancelar la reserva: no hay pagos pendientes para este mausoleo',
        );
      }

      // 5. Eliminar el pago pendiente
      await this.paymentService.remove(pagoPendiente.paymentId);

      // 6. Cambiar estado de todos los nichos a DISPONIBLE
      const resultados: Array<{ id: string; fila: number; columna: number; estado: EstadoNicho }> = [];
      for (const nicho of nichos) {
        nicho.estadoVenta = EstadoNicho.DISPONIBLE;
        await this.nichoRepository.save(nicho);
        resultados.push({
          id: nicho.id_nicho,
          fila: nicho.fila,
          columna: nicho.columna,
          estado: nicho.estadoVenta,
        });
      }

      return {
        mausoleo: {
          id: bloque.id_bloque,
          nombre: bloque.nombre,
          cementerio: bloque.cementerio?.nombre || 'N/A',
          totalNichos: nichos.length,
          nichosCancelados: resultados,
        },
        pago: {
          id: pagoPendiente.paymentId,
          codigo: pagoPendiente.paymentCode,
          monto: pagoPendiente.amount,
        },
        mensaje: `Reserva de mausoleo cancelada exitosamente. ${nichos.length} nichos volvieron a estado DISPONIBLE`,
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
        'Error interno al cancelar la reserva del mausoleo',
      );
    }
  }

  /**
   * Reserva un mausoleo completo (todos sus nichos) pasando el ID del bloque
   * @param reservarMausoleoDto Datos para reservar el mausoleo
   * @returns Objeto con información del mausoleo reservado y la orden de pago
   */
  async reservarMausoleo(reservarMausoleoDto: any) {
    try {
      console.log('=== RESERVAR MAUSOLEO - Datos recibidos ===');
      console.log('DTO:', JSON.stringify(reservarMausoleoDto, null, 2));
      
      // 1. Verificar que el bloque existe y es de tipo Mausoleo
      const bloque = await this.bloqueRepository.findOne({
        where: { id_bloque: reservarMausoleoDto.idBloque },
        relations: ['cementerio'],
      });

      console.log('Bloque encontrado:', bloque ? `${bloque.nombre} (${bloque.tipo_bloque})` : 'NO ENCONTRADO');

      if (!bloque) {
        throw new NotFoundException(
          `Bloque con ID ${reservarMausoleoDto.idBloque} no encontrado`,
        );
      }

      if (bloque.tipo_bloque !== 'Mausoleo') {
        throw new BadRequestException(
          `El bloque "${bloque.nombre}" no es de tipo Mausoleo. Tipo actual: ${bloque.tipo_bloque}`,
        );
      }

      // Cargar cementerio si no se cargó automáticamente
      if (!bloque.cementerio) {
        const bloqueConCementerio = await this.bloqueRepository.findOne({
          where: { id_bloque: reservarMausoleoDto.idBloque },
          relations: ['cementerio'],
        });
        if (bloqueConCementerio?.cementerio) {
          bloque.cementerio = bloqueConCementerio.cementerio;
        }
      }

      // 2. Obtener todos los nichos del mausoleo
      const nichos = await this.nichoRepository.find({
        where: { id_bloque: Equal(reservarMausoleoDto.idBloque) },
        relations: ['id_cementerio', 'id_bloque'],
        order: { fila: 'ASC', columna: 'ASC' },
      });

      console.log(`Nichos encontrados: ${nichos.length}`);

      if (nichos.length === 0) {
        throw new NotFoundException(
          `No se encontraron nichos para el mausoleo "${bloque.nombre}"`,
        );
      }

      // 3. Verificar que TODOS los nichos estén disponibles
      const nichoNoDisponible = nichos.find(
        n => n.estadoVenta !== EstadoNicho.DISPONIBLE
      );

      if (nichoNoDisponible) {
        throw new BadRequestException(
          `No se puede reservar el mausoleo. El nicho ${nichoNoDisponible.fila}-${nichoNoDisponible.columna} está en estado: ${nichoNoDisponible.estadoVenta}`,
        );
      }

      // 4. Verificar que la persona existe
      const persona = await this.personaRepository.findOne({
        where: { id_persona: reservarMausoleoDto.idPersona },
      });

      if (!persona) {
        throw new NotFoundException(
          `Persona con ID ${reservarMausoleoDto.idPersona} no encontrada`,
        );
      }

      if (persona.fallecido === true) {
        throw new BadRequestException(
          'No se puede asignar un mausoleo a una persona fallecida',
        );
      }

      console.log('Datos de la persona:', {
        cedula: (persona as any).cedula,
        nombres: (persona as any).nombres,
        apellidos: (persona as any).apellidos,
        direccion: (persona as any).direccion,
      });

      // 5. Crear la orden de pago única para todo el mausoleo
      const nombreCompleto = `${(persona as any).nombres || ''} ${(persona as any).apellidos || ''}`.trim();

      const conceptoPago = `Reserva de ${bloque.nombre} (${nichos.length} nichos)`;
      const ordenPago = await this.paymentService.create({
        buyerDocument: (persona as any).cedula || '0000000000',
        buyerName: nombreCompleto || 'Sin nombre',
        buyerDirection: reservarMausoleoDto.direccionComprador || (persona as any).direccion || 'No especificada',
        amount: reservarMausoleoDto.monto,
        generatedBy: reservarMausoleoDto.generadoPor,
        procedureType: 'mausoleum_sale',
        procedureId: bloque.id_bloque,
        observations: reservarMausoleoDto.observaciones || conceptoPago,
      });

      // 6. Cambiar estado de TODOS los nichos a RESERVADO
      for (const nicho of nichos) {
        nicho.estadoVenta = EstadoNicho.RESERVADO;
        await this.nichoRepository.save(nicho);
      }

      // Obtener nombre del cementerio
      const nombreCementerio = bloque.cementerio?.nombre || nichos[0]?.id_cementerio?.nombre || 'Cementerio';

      return {
        mausoleo: {
          id: bloque.id_bloque,
          nombre: bloque.nombre,
          descripcion: bloque.descripcion,
          cementerio: nombreCementerio,
          totalNichos: nichos.length,
          nichosReservados: nichos.map(n => ({
            id: n.id_nicho,
            fila: n.fila,
            columna: n.columna,
            estado: n.estadoVenta,
          })),
        },
        ordenPago: {
          id: ordenPago.paymentId,
          codigo: ordenPago.paymentCode,
          monto: ordenPago.amount,
          estado: ordenPago.status,
          fechaGeneracion: ordenPago.generatedDate,
          comprador: {
            documento: ordenPago.buyerDocument,
            nombre: ordenPago.buyerName,
            direccion: ordenPago.buyerDirection,
          },
          conceptoPago,
        },
        mensaje: `Se reservaron ${nichos.length} nichos del mausoleo ${bloque.nombre}. El monto total es $${reservarMausoleoDto.monto.toFixed(2)}. Proceda con el pago.`,
      };
    } catch (error) {
      // Log del error real para debugging
      console.error('Error detallado en reservarMausoleo:', error);
      
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Error interno al reservar el mausoleo: ${error.message || error}`,
      );
    }
  }

  /**
   * Confirma la venta de un mausoleo completo pasando el ID del pago
   * @param confirmarVentaDto Datos para confirmar la venta
   * @returns Información del mausoleo vendido y el pago confirmado
   */
  async confirmarVentaMausoleo(confirmarVentaDto: ConfirmarVentaNichoDto) {
    try {
      // 1. Obtener información del pago
      const pago = await this.paymentService.findOne(confirmarVentaDto.idPago);

      if (pago.procedureType !== 'mausoleum_sale') {
        throw new BadRequestException('El pago no corresponde a una venta de mausoleo');
      }

      // 2. Obtener el bloque (mausoleo) asociado al pago
      const bloque = await this.bloqueRepository.findOne({
        where: { id_bloque: pago.procedureId },
        relations: ['cementerio'],
      });

      if (!bloque) {
        throw new NotFoundException(`Mausoleo con ID ${pago.procedureId} no encontrado`);
      }

      // 3. Obtener todos los nichos del mausoleo
      const nichos = await this.nichoRepository.find({
        where: { id_bloque: Equal(bloque.id_bloque) },
        relations: ['id_cementerio', 'id_bloque'],
        order: { fila: 'ASC', columna: 'ASC' },
      });

      // 4. Verificar estado idempotente - si ya están VENDIDOS
      if (nichos.every(n => n.estadoVenta === EstadoNicho.VENDIDO)) {
        const pagoInfo = await this.paymentService.findOne(confirmarVentaDto.idPago);
        const nombreCementerio = bloque.cementerio?.nombre || nichos[0]?.id_cementerio?.nombre || 'Cementerio';
        return {
          mausoleo: {
            id: bloque.id_bloque,
            nombre: bloque.nombre,
            cementerio: nombreCementerio,
            totalNichos: nichos.length,
            nichosVendidos: nichos.map(n => ({
              id: n.id_nicho,
              fila: n.fila,
              columna: n.columna,
              estado: n.estadoVenta,
            })),
          },
          pago: {
            id: pagoInfo.paymentId,
            codigo: pagoInfo.paymentCode,
            monto: pagoInfo.amount,
            estado: pagoInfo.status,
            fechaPago: pagoInfo.paidDate,
            validadoPor: pagoInfo.validatedBy,
            comprador: {
              documento: pagoInfo.buyerDocument,
              nombre: pagoInfo.buyerName,
              direccion: pagoInfo.buyerDirection,
            },
          },
          siguientePaso: {
            accion: 'crear_propietario',
            mensaje: `El mausoleo ya está marcado como VENDIDO (${nichos.length} nichos)`,
            datos: {
              idBloque: bloque.id_bloque,
              idPago: pagoInfo.paymentId,
            },
          },
        };
      }

      // 5. Verificar que TODOS estén RESERVADOS
      const nichoNoReservado = nichos.find(
        n => n.estadoVenta !== EstadoNicho.RESERVADO
      );

      if (nichoNoReservado) {
        throw new BadRequestException(
          `No se puede confirmar la venta del mausoleo. El nicho ${nichoNoReservado.fila}-${nichoNoReservado.columna} está en estado: ${nichoNoReservado.estadoVenta}`,
        );
      }

      // 6. Confirmar el pago
      let pagoConfirmado;
      if (pago.status === 'paid') {
        pagoConfirmado = pago;
      } else {
        pagoConfirmado = await this.paymentService.confirmPayment(
          confirmarVentaDto.idPago,
          confirmarVentaDto.validadoPor,
          confirmarVentaDto.archivoRecibo,
        );
      }

      // 7. Cambiar estado de TODOS los nichos a VENDIDO
      for (const nicho of nichos) {
        nicho.estadoVenta = EstadoNicho.VENDIDO;
        await this.nichoRepository.save(nicho);
      }

      const nombreCementerio = bloque.cementerio?.nombre || nichos[0]?.id_cementerio?.nombre || 'Cementerio';

      return {
        mausoleo: {
          id: bloque.id_bloque,
          nombre: bloque.nombre,
          cementerio: nombreCementerio,
          totalNichos: nichos.length,
          nichosVendidos: nichos.map(n => ({
            id: n.id_nicho,
            fila: n.fila,
            columna: n.columna,
            estado: n.estadoVenta,
          })),
        },
        pago: {
          id: pagoConfirmado.paymentId,
          codigo: pagoConfirmado.paymentCode,
          monto: pagoConfirmado.amount,
          estado: pagoConfirmado.status,
          fechaPago: pagoConfirmado.paidDate,
          validadoPor: pagoConfirmado.validatedBy,
          comprador: {
            documento: pagoConfirmado.buyerDocument,
            nombre: pagoConfirmado.buyerName,
            direccion: pagoConfirmado.buyerDirection,
          },
        },
        siguientePaso: {
          accion: 'crear_propietario',
          mensaje: `Ahora debe registrar al propietario del mausoleo (${nichos.length} nichos vendidos)`,
          datos: {
            idBloque: bloque.id_bloque,
            idPago: pagoConfirmado.paymentId,
            totalNichosVendidos: nichos.length,
          },
        },
        mensaje: `Se confirmó la venta de ${nichos.length} nichos del mausoleo ${bloque.nombre}`,
      };
    } catch (error) {
      // Log del error real para debugging
      console.error('Error detallado en confirmarVentaMausoleo:', error);
      
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Error interno al confirmar la venta del mausoleo: ${error.message || error}`,
      );
    }
  }

  /**
   * Registra al propietario de un mausoleo completo pasando el ID del bloque
   * Crea propietarios para todos los nichos del mausoleo
   * @param idBloque ID del bloque (mausoleo)
   * @param idPersona ID de la persona que será propietaria
   * @param tipoDocumento Tipo de documento del propietario
   * @param numeroDocumento Número de documento del propietario
   * @param razon Razón de la adquisición
   * @returns Información de los propietarios registrados
   */
  async registrarPropietarioMausoleo(
    idBloque: string,
    idPersona: string,
    tipoDocumento: string,
    numeroDocumento: string,
    razon: string = 'Compra de mausoleo',
  ) {
    try {
      // 1. Verificar que el bloque existe y es un mausoleo
      const bloque = await this.bloqueRepository.findOne({
        where: { id_bloque: idBloque },
      });

      if (!bloque) {
        throw new NotFoundException(`Bloque con ID ${idBloque} no encontrado`);
      }

      if (bloque.tipo_bloque !== 'Mausoleo') {
        throw new BadRequestException(
          `El bloque "${bloque.nombre}" no es de tipo Mausoleo`,
        );
      }

      // 2. Obtener todos los nichos del mausoleo
      const nichos = await this.nichoRepository.find({
        where: { id_bloque: Equal(idBloque) },
        order: { fila: 'ASC', columna: 'ASC' },
      });

      if (nichos.length === 0) {
        throw new NotFoundException(
          `No se encontraron nichos para el mausoleo "${bloque.nombre}"`,
        );
      }

      // 3. Verificar que TODOS los nichos estén VENDIDOS
      const nichoNoVendido = nichos.find(
        n => n.estadoVenta !== EstadoNicho.VENDIDO
      );

      if (nichoNoVendido) {
        throw new BadRequestException(
          `No se puede registrar propietario del mausoleo. El nicho ${nichoNoVendido.fila}-${nichoNoVendido.columna} está en estado: ${nichoNoVendido.estadoVenta}`,
        );
      }

      // 4. Verificar que ningún nicho tenga propietario activo
      for (const nicho of nichos) {
        const propietarioActivo = await this.nichoPropietarioRepository.findOne({
          where: {
            id_nicho: Equal(nicho.id_nicho),
            activo: true,
          },
        });

        if (propietarioActivo) {
          throw new BadRequestException(
            `El nicho ${nicho.fila}-${nicho.columna} del mausoleo ya tiene un propietario activo`,
          );
        }
      }

      // 5. Crear propietarios para TODOS los nichos
      const propietariosCreados: Array<{
        id: string;
        nicho: {
          id: string;
          fila: number;
          columna: number;
        };
        fechaAdquisicion: Date;
        tipo: string;
        activo: boolean;
      }> = [];
      const fechaAdquisicion = new Date();

      for (const nicho of nichos) {
        const propietario = await this.propietariosNichosService.create({
          id_persona: { id_persona: idPersona },
          id_nicho: { id_nicho: nicho.id_nicho },
          fecha_adquisicion: fechaAdquisicion,
          tipo_documento: tipoDocumento,
          numero_documento: numeroDocumento,
          activo: true,
          razon: razon,
          tipo: TipoPropietario.Dueño,
        });

        propietariosCreados.push({
          id: propietario.id_propietario_nicho,
          nicho: {
            id: nicho.id_nicho,
            fila: nicho.fila,
            columna: nicho.columna,
          },
          fechaAdquisicion: propietario.fecha_adquisicion,
          tipo: propietario.tipo,
          activo: propietario.activo,
        });
      }

      return {
        mausoleo: {
          id: bloque.id_bloque,
          nombre: bloque.nombre,
          totalNichos: nichos.length,
          propietarios: propietariosCreados,
        },
        persona: idPersona,
        fechaAdquisicion: fechaAdquisicion,
        mensaje: `Propietario registrado exitosamente para ${propietariosCreados.length} nichos del mausoleo ${bloque.nombre}`,
      };
    } catch (error) {
      // Log del error real para debugging
      console.error('Error detallado en registrarPropietarioMausoleo:', error);
      
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Error interno al registrar el propietario del mausoleo: ${error.message || error}`,
      );
    }
  }
}
