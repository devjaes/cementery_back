import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpStatus,
  HttpException,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NicheSalesService } from './sales.service';
import { ReservarNichoDto } from './dto/reservar-nicho.dto';
import { ReservarMausoleoDto } from './dto/reservar-mausoleo.dto';
import { ConfirmarVentaNichoDto } from './dto/confirmar-venta-nicho.dto';
import { RegistrarPropietarioMausoleoDto } from './dto/registrar-propietario-mausoleo.dto';
import { EstadoNicho } from './enum/estadoNicho.enum';
import { PaymentService } from 'src/payment/payment.service';
import { Response } from 'express';

@ApiTags('Ventas de Nichos')
@Controller('nicho-sales')
export class NicheSalesController {
  constructor(private readonly nicheSalesService: NicheSalesService,
    private readonly paymentService: PaymentService
  ) {}

@Post('reservar')
  @ApiOperation({
    summary: 'Reservar un nicho',
    description: 'Reserva un nicho para un cliente y crea una orden de pago',
  })
  @ApiResponse({
    status: 201,
    description: 'Nicho reservado exitosamente (PDF generado)',
    schema: {
      example: {
        message: 'Recibo generado correctamente',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o nicho no disponible',
  })
  @ApiResponse({
    status: 404,
    description: 'Nicho o persona no encontrada',
  })
  async reservarNicho(
    @Body() reservarNichoDto: ReservarNichoDto,
    @Res() res: Response,
  ) {
    try {
      // 1️⃣ Reservar el nicho y obtener la orden de pago
      const reserva = await this.nicheSalesService.reservarNicho(reservarNichoDto);

      // 2️⃣ Generar el recibo PDF
      const receiptPath = await this.paymentService.generateReceipt(reserva.ordenPago.id);

      // 3️⃣ Configurar los encabezados HTTP
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="recibo-reserva-${reserva.ordenPago.codigo}.pdf"`,
      );
      res.setHeader('X-Reserva-Data', JSON.stringify(reserva));
      res.setHeader('Access-Control-Expose-Headers', 'X-Reserva-Data');

      // 4️⃣ Enviar el PDF
      return res.sendFile(receiptPath);
    } catch (error) {
      console.error('Error al generar recibo:', error);
      throw new HttpException(
        {
          message: 'No se pudo generar el recibo de la reserva.',
          error: error instanceof Error ? error.message : String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('confirmar-venta')
  @ApiOperation({
    summary: 'Confirmar venta de nicho',
    description: 'Confirma la venta después de que finanzas aprueba el pago',
  })
  @ApiResponse({
    status: 200,
    description: 'Venta confirmada exitosamente',
    schema: {
      example: {
        nicho: {
          id: 'uuid',
          sector: 'A',
          fila: '1',
          numero: '001',
          estado: 'Vendido',
          cementerio: 'Cementerio Central',
        },
        pago: {
          id: 'uuid',
          codigo: 'PAY-241010-123456-001',
          monto: 500.00,
          estado: 'paid',
          fechaPago: '2024-10-10T15:00:00Z',
          validadoPor: 'admin@cemetery.com',
          comprador: {
            documento: '1234567890',
            nombre: 'Juan Pérez',
            direccion: 'Calle Principal 123',
          },
        },
        siguientePaso: {
          accion: 'crear_propietario',
          mensaje: 'Ahora debe registrar al propietario del nicho',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Pago ya confirmado o datos inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Pago no encontrado',
  })
  async confirmarVentaNicho(@Body() confirmarVentaDto: ConfirmarVentaNichoDto) {
    try {
      return await this.nicheSalesService.confirmarVentaNicho(confirmarVentaDto);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('registrar-propietario/:idNicho/:idPersona')
  @ApiOperation({
    summary: 'Registrar propietario de nicho',
    description: 'Registra al propietario después de confirmar la venta',
  })
  @ApiParam({
    name: 'idNicho',
    description: 'ID del nicho vendido',
    type: 'string',
  })
  @ApiParam({
    name: 'idPersona',
    description: 'ID de la persona propietaria',
    type: 'string',
  })
  @ApiResponse({
    status: 201,
    description: 'Propietario registrado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Nicho no vendido o ya tiene propietario',
  })
  @ApiResponse({
    status: 404,
    description: 'Nicho o persona no encontrada',
  })
  async registrarPropietarioNicho(
    @Param('idNicho') idNicho: string,
    @Param('idPersona') idPersona: string,
    @Body() datos: {
      tipoDocumento: string;
      numeroDocumento: string;
      razon?: string;
    },
  ) {
    try {
      return await this.nicheSalesService.registrarPropietarioNicho(
        idNicho,
        idPersona,
        datos.tipoDocumento,
        datos.numeroDocumento,
        datos.razon,
      );
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('historial')
  @ApiOperation({
    summary: 'Obtener historial de ventas',
    description: 'Obtiene el historial de ventas de nichos con filtros opcionales',
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    enum: EstadoNicho,
    description: 'Filtrar por estado del nicho',
  })
  @ApiQuery({
    name: 'cementerio',
    required: false,
    type: 'string',
    description: 'Filtrar por cementerio',
  })
  @ApiQuery({
    name: 'sector',
    required: false,
    type: 'string',
    description: 'Filtrar por sector',
  })
  @ApiQuery({
    name: 'fechaDesde',
    required: false,
    type: 'string',
    format: 'date-time',
    description: 'Fecha desde (ISO string)',
  })
  @ApiQuery({
    name: 'fechaHasta',
    required: false,
    type: 'string',
    format: 'date-time',
    description: 'Fecha hasta (ISO string)',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial obtenido exitosamente',
  })
  async obtenerHistorialVentas(
    @Query('estado') estado?: EstadoNicho,
    @Query('cementerio') cementerio?: string,
    @Query('sector') sector?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    try {
      const filtros: any = {};
      
      if (estado) filtros.estado = estado;
      if (cementerio) filtros.cementerio = cementerio;
      if (sector) filtros.sector = sector;
      if (fechaDesde) filtros.fechaDesde = new Date(fechaDesde);
      if (fechaHasta) filtros.fechaHasta = new Date(fechaHasta);

      return await this.nicheSalesService.obtenerHistorialVentas(filtros);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('cancelar-reserva/:idNicho')
  @ApiOperation({
    summary: 'Cancelar reserva de nicho',
    description: 'Cancela una reserva de nicho (solo si el pago no ha sido confirmado)',
  })
  @ApiParam({
    name: 'idNicho',
    description: 'ID del nicho a cancelar',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Reserva cancelada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede cancelar la reserva',
  })
  @ApiResponse({
    status: 404,
    description: 'Nicho no encontrado',
  })
  async cancelarReservaNicho(
    @Param('idNicho') idNicho: string,
    @Body() datos: { motivo: string },
  ) {
    try {
      return await this.nicheSalesService.cancelarReservaNicho(
        idNicho,
        datos.motivo,
      );
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============================================
  // ENDPOINTS ESPECÍFICOS PARA MAUSOLEOS
  // ============================================

  @Post('mausoleo/reservar')
  @ApiOperation({
    summary: 'Reservar un mausoleo completo',
    description: 'Reserva todos los nichos de un mausoleo y crea una orden de pago única',
  })
  @ApiResponse({
    status: 201,
    description: 'Mausoleo reservado exitosamente (PDF generado)',
  })
  @ApiResponse({
    status: 400,
    description: 'Bloque no es un mausoleo o no está disponible',
  })
  @ApiResponse({
    status: 404,
    description: 'Mausoleo o persona no encontrada',
  })
  async reservarMausoleo(
    @Body() reservarMausoleoDto: ReservarMausoleoDto,
    @Res() res: Response,
  ) {
    try {
      // 1️⃣ Reservar el mausoleo y obtener la orden de pago
      const reserva = await this.nicheSalesService.reservarMausoleo(reservarMausoleoDto);

      // 2️⃣ Generar el recibo PDF
      const receiptPath = await this.paymentService.generateReceipt(reserva.ordenPago.id);

      // 3️⃣ Configurar los encabezados HTTP
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="recibo-reserva-mausoleo-${reserva.ordenPago.codigo}.pdf"`,
      );
      res.setHeader('X-Reserva-Data', JSON.stringify(reserva));
      res.setHeader('Access-Control-Expose-Headers', 'X-Reserva-Data');

      // 4️⃣ Enviar el PDF
      return res.sendFile(receiptPath);
    } catch (error) {
      console.error('Error al generar recibo de mausoleo:', error);
      throw new HttpException(
        {
          message: 'No se pudo generar el recibo de la reserva del mausoleo.',
          error: error instanceof Error ? error.message : String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('mausoleo/confirmar-venta')
  @ApiOperation({
    summary: 'Confirmar venta de mausoleo',
    description: 'Confirma la venta de un mausoleo completo después de que finanzas aprueba el pago',
  })
  @ApiResponse({
    status: 200,
    description: 'Venta de mausoleo confirmada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Pago no corresponde a un mausoleo o datos inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Pago o mausoleo no encontrado',
  })
  async confirmarVentaMausoleo(@Body() confirmarVentaDto: ConfirmarVentaNichoDto) {
    try {
      return await this.nicheSalesService.confirmarVentaMausoleo(confirmarVentaDto);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('mausoleo/registrar-propietario')
  @ApiOperation({
    summary: 'Registrar propietario de mausoleo',
    description: 'Registra al propietario para todos los nichos del mausoleo después de confirmar la venta',
  })
  @ApiResponse({
    status: 201,
    description: 'Propietario registrado exitosamente para todos los nichos del mausoleo',
  })
  @ApiResponse({
    status: 400,
    description: 'Mausoleo no vendido o ya tiene propietario',
  })
  @ApiResponse({
    status: 404,
    description: 'Mausoleo o persona no encontrada',
  })
  async registrarPropietarioMausoleo(
    @Body() datos: RegistrarPropietarioMausoleoDto,
  ) {
    try {
      return await this.nicheSalesService.registrarPropietarioMausoleo(
        datos.idBloque,
        datos.idPersona,
        datos.tipoDocumento,
        datos.numeroDocumento,
        datos.razon || 'Compra de mausoleo',
      );
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('mausoleo/cancelar-reserva/:idBloque')
  @ApiOperation({
    summary: 'Cancelar reserva de mausoleo',
    description: 'Cancela la reserva de un mausoleo completo (solo si el pago no ha sido confirmado)',
  })
  @ApiParam({
    name: 'idBloque',
    description: 'ID del bloque (mausoleo) a cancelar',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Reserva de mausoleo cancelada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede cancelar la reserva (nichos no reservados o pago ya confirmado)',
  })
  @ApiResponse({
    status: 404,
    description: 'Mausoleo no encontrado',
  })
  async cancelarReservaMausoleo(
    @Param('idBloque') idBloque: string,
    @Body() datos: { motivo: string },
  ) {
    try {
      return await this.nicheSalesService.cancelarReservaMausoleo(
        idBloque,
        datos.motivo,
      );
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
