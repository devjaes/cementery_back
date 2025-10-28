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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NicheSalesService } from './sales.service';
import { ReservarNichoDto } from './dto/reservar-nicho.dto';
import { ConfirmarVentaNichoDto } from './dto/confirmar-venta-nicho.dto';
import { EstadoNicho } from './enum/estadoNicho.enum';

@ApiTags('Ventas de Nichos')
@Controller('nicho-sales')
export class NicheSalesController {
  constructor(private readonly nicheSalesService: NicheSalesService) {}

  @Post('reservar')
  @ApiOperation({
    summary: 'Reservar un nicho',
    description: 'Reserva un nicho para un cliente y crea una orden de pago',
  })
  @ApiResponse({
    status: 201,
    description: 'Nicho reservado exitosamente',
    schema: {
      example: {
        nicho: {
          id: 'uuid',
          sector: 'A',
          fila: '1',
          numero: '001',
          estado: 'Reservado',
          cementerio: 'Cementerio Central',
        },
        cliente: {
          id: 'uuid',
          nombres: 'Juan',
          apellidos: 'Pérez',
          cedula: '1234567890',
        },
        ordenPago: {
          id: 'uuid',
          codigo: 'PAY-241010-123456-001',
          monto: 500.00,
          estado: 'pending',
          fechaGeneracion: '2024-10-10T10:00:00Z',
          comprador: {
            documento: '1234567890',
            nombre: 'Juan Pérez',
            direccion: 'Calle Principal 123',
          },
        },
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
  async reservarNicho(@Body() reservarNichoDto: ReservarNichoDto) {
    try {
      return await this.nicheSalesService.reservarNicho(reservarNichoDto);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
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
}