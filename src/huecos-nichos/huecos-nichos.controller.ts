import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { HuecosNichosService } from './huecos-nichos.service';
import { CreateHuecosNichoDto } from './dto/create-huecos-nicho.dto';
import { UpdateHuecosNichoDto } from './dto/update-huecos-nicho.dto';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { HuecosNicho } from './entities/huecos-nicho.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('huecos-nichos')
export class HuecosNichosController {
  constructor(private readonly huecosNichosService: HuecosNichosService) {}

  @Post()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Crear un nuevo hueco para el nicho',
    description:
      'Crea un hueco automáticamente asignando el siguiente número disponible para el nicho. El estado por defecto es "Disponible".',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({
    description: 'Crear hueco con PDF de ampliación (obligatorio)',
    schema: {
      type: 'object',
      properties: {
        id_nicho: { type: 'string', format: 'uuid' },
        estado: { type: 'string', enum: ['Disponible', 'Ocupado', 'Reservado'] },
        id_fallecido: { type: 'string', format: 'uuid', nullable: true },
        observacion_ampliacion: { type: 'string', nullable: true, maxLength: 500 },
        file: { type: 'string', format: 'binary', description: 'PDF de ampliación (obligatorio)' },
      },
      required: ['id_nicho', 'file'],
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Hueco creado exitosamente. El número de hueco se asigna automáticamente basado en los huecos existentes.',
  })
  create(
    @Body() createHuecosNichoDto: CreateHuecosNichoDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.huecosNichosService.create(createHuecosNichoDto, file);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los huecos' })
  @ApiResponse({ status: 200, description: 'Lista de huecos' })
  findAll() {
    return this.huecosNichosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un hueco por ID' })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Detalles del hueco' })
  @ApiResponse({ status: 404, description: 'Hueco no encontrado' })
  findOne(@Param('id') id: string) {
    return this.huecosNichosService.findOne(id);
  }

  @Get('por-nicho/:idNicho')
  @ApiOperation({ summary: 'Obtener todos los huecos de un nicho por su ID' })
  @ApiParam({
    name: 'idNicho',
    example: '456e7890-f12a-45c6-b789-123456789abc',
  })
  @ApiResponse({ status: 200, description: 'Lista de huecos del nicho' })
  @ApiResponse({
    status: 404,
    description: 'No se encontraron huecos para el nicho dado',
  })
  async findByNicho(@Param('idNicho') idNicho: string): Promise<HuecosNicho[]> {
    const result = await this.huecosNichosService.findByNicho(idNicho);
    return result.map((item: any) => item.hueco);
  }

  @Patch(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Actualizar un hueco' })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({
    description: 'Actualizar hueco; el PDF es opcional y reemplaza al existente si se envía',
    schema: {
      type: 'object',
      properties: {
        id_detalle_hueco: { type: 'string', format: 'uuid' },
        estado: { type: 'string', enum: ['Disponible', 'Ocupado', 'Reservado'], nullable: true },
        id_fallecido: { type: 'string', format: 'uuid', nullable: true },
        observacion_ampliacion: { type: 'string', nullable: true, maxLength: 500 },
        file: { type: 'string', format: 'binary', description: 'PDF de ampliación (opcional)' },
      },
      required: ['id_detalle_hueco'],
    },
  })
  @ApiResponse({ status: 200, description: 'Hueco actualizado' })
  @ApiResponse({ status: 404, description: 'Hueco no encontrado' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateHuecosNichoDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.huecosNichosService.update(id, updateDto, file);
  }

  @Delete(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Eliminar un hueco' })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Hueco eliminado' })
  @ApiResponse({ status: 404, description: 'Hueco no encontrado' })
  remove(@Param('id') id: string) {
    return this.huecosNichosService.remove(id);
  }

  @Get('disponibles')
  @ApiOperation({ summary: 'Obtener todos los huecos de nichos disponibles' })
  findAllDisponibles() {
    return this.huecosNichosService.findAllDisponibles();
  }

  @Get('Cementerio/nichos/:idCementerio')
  @ApiOperation({
    summary:
      'Obtener todos los huecos de nichos disponibles por ID de cementerio',
  })
  @ApiParam({
    name: 'idCementerio',
    example: '789e0123-a456-78b9-c012-345678901234',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de huecos disponibles por cementerio',
  })
  findAllDisponiblesByCementerio(@Param('idCementerio') idCementerio: string) {
    return this.huecosNichosService.findAllDisponiblesByCementerio(
      idCementerio,
    );
  }

  @Get(':id/archivo')
  @ApiOperation({
    summary: 'Descargar el archivo PDF de ampliación de un hueco',
    description:
      'Retorna el archivo PDF de ampliación asociado al hueco. Si no existe, retorna 404.',
  })
  @ApiParam({
    name: 'id',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo PDF descargado exitosamente',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Hueco no encontrado o archivo no disponible',
  })
  async descargarArchivo(@Param('id') id: string, @Res() res: Response) {
    const filePath = await this.huecosNichosService.obtenerRutaArchivo(id);
    if (!filePath) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Archivo de ampliación no encontrado para este hueco',
      });
    }
    const path = await import('path');
    const fullPath = path.join(process.cwd(), filePath);
    return res.sendFile(fullPath, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ampliacion-hueco-${id}.pdf"`,
      },
    });
  }
}
