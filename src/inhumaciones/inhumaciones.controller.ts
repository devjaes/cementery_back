import { Controller, Get, Post, Body, Param, Put, Delete, Patch, UseGuards } from '@nestjs/common';
import { InhumacionesService } from './inhumaciones.service';
import { Inhumacion } from './entities/inhumacion.entity';
import { UpdateInhumacionDto } from './dto/update-inhumacione.dto';
import { CreateInhumacionDto } from './dto/create-inhumaciones.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBearerAuth
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiBearerAuth()
@ApiTags('Inhumaciones')
@Controller('inhumaciones')
export class InhumacionesController {
  constructor(private readonly service: InhumacionesService) {}

  @Post()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ 
    summary: 'Crear nueva inhumación', 
    description: 'Registra una nueva inhumación en el sistema' 
  })
  @ApiBody({ 
    type: CreateInhumacionDto,
    examples: {
      ejemplo1: {
        summary: 'Inhumación básica',
        value: {
          id_nicho: "123e4567-e89b-12d3-a456-426614174000",
          id_fallecido: "123e4567-e89b-12d3-a456-426614174001",
          fecha_inhumacion: "2023-06-15",
          hora_inhumacion: "14:30",
          solicitante: "Juan Pérez",
          responsable_inhumacion: "Carlos Gómez",
          observaciones: "Requiere traslado desde otro cementerio",
          codigo_inhumacion: "INH-2023-001",
          estado: "Pendiente"
        }
      },
      ejemplo2: {
        summary: 'Inhumación realizada con observaciones',
        value: {
          id_nicho: "223e4567-e89b-12d3-a456-426614174002",
          id_fallecido: "223e4567-e89b-12d3-a456-426614174003",
          fecha_inhumacion: "2024-01-10",
          hora_inhumacion: "10:00",
          solicitante: "María López",
          responsable_inhumacion: "Pedro Ruiz",
          observaciones: "Familiares presentes",
          codigo_inhumacion: "INH-2024-002",
          estado: "Realizado"
        }
      },
      ejemplo3: {
        summary: 'Inhumación pendiente sin observaciones',
        value: {
          id_nicho: "323e4567-e89b-12d3-a456-426614174004",
          id_fallecido: "323e4567-e89b-12d3-a456-426614174005",
          fecha_inhumacion: "2024-07-20",
          hora_inhumacion: "09:00",
          solicitante: "Carlos Torres",
          responsable_inhumacion: "Ana Martínez",
          observaciones: "",
          codigo_inhumacion: "INH-2024-003",
          estado: "Pendiente"
        }
      }
    }
  })
  @ApiCreatedResponse({ 
    description: 'Inhumación creada exitosamente',
    type: Inhumacion 
  })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos' })
  async crearInhumacion(@Body() datos: CreateInhumacionDto) {
    return this.service.create(datos);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Obtener todas las inhumaciones', 
    description: 'Devuelve una lista de todas las inhumaciones registradas' 
  })
  @ApiOkResponse({ 
    description: 'Lista de inhumaciones obtenida exitosamente',
    type: [Inhumacion] 
  })
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener inhumación por ID', 
    description: 'Obtiene los detalles de una inhumación específica' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de la inhumación',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiOkResponse({ 
    description: 'Inhumación encontrada',
    type: Inhumacion 
  })
  @ApiNotFoundResponse({ description: 'Inhumación no encontrada' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ 
    summary: 'Actualizar inhumación', 
    description: 'Actualiza completamente la información de una inhumación existente' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de la inhumación a actualizar',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({ 
    type: UpdateInhumacionDto,
    examples: {
      ejemplo1: {
        value: {
          estado: "Completado"
        }
      }
    }
  })
  @ApiOkResponse({ 
    description: 'Inhumación actualizada exitosamente',
    type: Inhumacion 
  })
  @ApiNotFoundResponse({ description: 'Inhumación no encontrada' })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateInhumacionDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ 
    summary: 'Eliminar inhumación', 
    description: 'Elimina permanentemente un registro de inhumación' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de la inhumación a eliminar',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiOkResponse({ description: 'Inhumación eliminada exitosamente' })
  @ApiNotFoundResponse({ description: 'Inhumación no encontrada' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get('/fallecido/cedula/:cedula')
  @ApiOperation({ summary: 'Buscar información de fallecido, sus huecos, nichos y cementerios por cédula' })
  @ApiParam({ name: 'cedula', description: 'Cédula del fallecido', example: '1234567890' })
  @ApiOkResponse({ description: 'Información encontrada' })
  @ApiNotFoundResponse({ description: 'Fallecido no encontrado' })
  async findByCedulaFallecido(@Param('cedula') cedula: string) {
    return this.service.findByCedulaFallecido(cedula);
  }

  @Get('/solicitante/cedula/:cedula')
  @ApiOperation({ summary: 'Buscar inhumaciones por cédula del solicitante, solo si la inhumación tiene un requisito vinculado' })
  @ApiParam({ name: 'cedula', description: 'Cédula del solicitante', example: '1234567890' })
  @ApiOkResponse({ description: 'Inhumaciones encontradas' })
  @ApiNotFoundResponse({ description: 'Solicitante o inhumaciones no encontradas' })
  async findByCedulaSolicitante(@Param('cedula') cedula: string) {
    return this.service.findByCedulaSolicitante(cedula);
  }

  @Get('fallecidos/:busqueda')
  @ApiOperation({ summary: 'Buscar fallecidos en inhumaciones por cédula, nombres o apellidos (búsqueda parcial)' })
  @ApiParam({ 
    name: 'busqueda', 
    example: 'Pablo',
    description: 'Término de búsqueda para cédula, nombres o apellidos del fallecido'
  })
  @ApiResponse({ status: 200, description: 'Lista de fallecidos encontrados en inhumaciones' })
  findFallecidos(@Param('busqueda') busqueda: string) {
    return this.service.findByBusquedaFallecido(busqueda);
  }
}