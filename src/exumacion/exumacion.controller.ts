import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ExumacionService } from './exumacion.service';
import { CreateExumacionDto } from './dto/create-exumacion.dto';
import { UpdateExumacionDto } from './dto/update-exumacion.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBearerAuth
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiBearerAuth()
@ApiTags('Exhumaciones')
@Controller('exumaciones')
export class ExumacionController {
  constructor(private readonly exumacionService: ExumacionService) {}

  @Post()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Crear nueva exhumación', description: 'Registra una nueva solicitud de exhumación' })
  @ApiBody({ type: CreateExumacionDto })
  @ApiCreatedResponse({ 
    description: 'Exhumación creada exitosamente',
    type: CreateExumacionDto
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Body() createExumacionDto: CreateExumacionDto) {
    return this.exumacionService.create(createExumacionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las exhumaciones', description: 'Obtiene todas las solicitudes de exhumación' })
  @ApiOkResponse({ 
    description: 'Lista de exhumaciones obtenida',
    type: [CreateExumacionDto]
  })
  findAll() {
    return this.exumacionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener exhumación por ID', description: 'Obtiene los detalles de una exhumación específica' })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de la exhumación',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiOkResponse({ 
    description: 'Exhumación encontrada',
    type: CreateExumacionDto
  })
  @ApiNotFoundResponse({ description: 'Exhumación no encontrada' })
  findOne(@Param('id') id: string) {
    return this.exumacionService.findOne(id);
  }

  @Patch(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Actualizar exhumación', description: 'Actualiza los datos de una exhumación existente' })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de la exhumación a actualizar',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({ type: UpdateExumacionDto })
  @ApiOkResponse({ 
    description: 'Exhumación actualizada exitosamente',
    type: UpdateExumacionDto
  })
  @ApiNotFoundResponse({ description: 'Exhumación no encontrada' })
  update(@Param('id') id: string, @Body() updateExumacionDto: UpdateExumacionDto) {
    return this.exumacionService.update(id, updateExumacionDto);
  }

  @Delete(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Eliminar exhumación', description: 'Elimina permanentemente una solicitud de exhumación' })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de la exhumación a eliminar',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiOkResponse({ description: 'Exhumación eliminada exitosamente' })
  @ApiNotFoundResponse({ description: 'Exhumación no encontrada' })
  remove(@Param('id') id: string) {
    return this.exumacionService.remove(id);
  }

  @Get(':id/formulario')
  @ApiOperation({ summary: 'Generar formulario PDF', description: 'Genera el formulario PDF de la exhumación' })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de la exhumación',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiOkResponse({ 
    description: 'PDF generado exitosamente',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Exhumación no encontrada' })
  generarFormulario(@Param('id') id: string) {
    return this.exumacionService.generarFormularioExumacion(id);
  }
}