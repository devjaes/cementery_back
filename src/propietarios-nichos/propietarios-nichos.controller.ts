import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PropietariosNichosService } from './propietarios-nichos.service';
import { CreatePropietarioNichoDto } from './dto/create-propietarios-nicho.dto';
import { UpdatePropietarioNichoDto } from './dto/update-propietarios-nicho.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('Propietarios de Nichos') // Agrupa los endpoints en Swagger UI
@Controller('propietarios-nichos')
export class PropietariosNichosController {
  constructor(private readonly propietariosService: PropietariosNichosService) {}

  @Post()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Crear nuevo propietario de nicho', description: 'Registra una nueva relación de propiedad de nicho' })
  @ApiBody({ type: CreatePropietarioNichoDto })
  @ApiCreatedResponse({ 
    description: 'Propietario de nicho creado exitosamente',
    type: CreatePropietarioNichoDto
  })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos' })
  create(@Body() dto: CreatePropietarioNichoDto) {
    return this.propietariosService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los propietarios de nichos', description: 'Obtiene todos los registros de propietarios de nichos' })
  @ApiOkResponse({ 
    description: 'Lista de propietarios de nichos obtenida exitosamente',
    type: [CreatePropietarioNichoDto]
  })
  findAll() {
    return this.propietariosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener propietario de nicho por ID', description: 'Obtiene un registro específico de propietario de nicho' })
  @ApiParam({ name: 'id', description: 'ID del propietario de nicho', type: String })
  @ApiOkResponse({ 
    description: 'Propietario de nicho encontrado',
    type: CreatePropietarioNichoDto
  })
  @ApiNotFoundResponse({ description: 'Propietario de nicho no encontrado' })
  findOne(@Param('id') id: string) {
    return this.propietariosService.findOne(id);
  }

  @Get('por-nicho/:idNicho')
  @ApiOperation({ summary: 'Obtener propietarios de nicho por ID de nicho, solo los que esten activos', description: 'Obtiene todos los registros de propietarios de nicho por ID de nicho que esten activos' })
  @ApiParam({ name: 'idNicho', description: 'ID del nicho', type: String })
  @ApiOkResponse({ 
    description: 'Lista de propietarios de nicho obtenida exitosamente',
    type: [CreatePropietarioNichoDto]
  })
  findByNicho(@Param('idNicho') idNicho: string) {
    return this.propietariosService.findByNicho(idNicho);
  }

  @Get('historial/:idNicho')
    @ApiOperation({ summary: 'Obtener propietarios de nicho por ID de nicho', description: 'Obtiene todos los registros de propietarios de nicho por ID' })
    @ApiParam({ name: 'idNicho', description: 'ID del nicho', type: String })
    @ApiOkResponse({ 
      description: 'Lista de propietarios de nicho obtenida exitosamente',
      type: [CreatePropietarioNichoDto]
    })
    historial(@Param('idNicho') idNicho: string) {
      return this.propietariosService.historial(idNicho);
    }

  @Get('por-persona/:cedula')
  @ApiOperation({ summary: 'Obtener propietarios de nicho por la cedula del propietario', description: 'Obtiene el registro del propietario que sea buscado por su cedula y el nicho al que es dueño' })
  @ApiParam({ name: 'cedula', description: 'cedula del dueño', type: String })
  @ApiOkResponse({ 
    description: 'Lista de propietarios de nicho obtenida exitosamente',
    type: [CreatePropietarioNichoDto]
  })
  findByPersona(@Param('cedula') cedula: string) {
    return this.propietariosService.findByPersona(cedula);
  }
    
  @Patch(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Actualizar propietario de nicho', description: 'Actualiza parcialmente un registro de propietario de nicho' })
  @ApiParam({ name: 'id', description: 'ID del propietario de nicho a actualizar', type: String })
  @ApiBody({ type: UpdatePropietarioNichoDto })
  @ApiOkResponse({ 
    description: 'Propietario de nicho actualizado exitosamente',
    type: CreatePropietarioNichoDto
  })
  @ApiNotFoundResponse({ description: 'Propietario de nicho no encontrado' })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos' })
  update(@Param('id') id: string, @Body() dto: UpdatePropietarioNichoDto) {
    return this.propietariosService.update(id, dto);
  }

  @Delete(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Eliminar propietario de nicho', description: 'Elimina permanentemente un registro de propietario de nicho' })
  @ApiParam({ name: 'id', description: 'ID del propietario de nicho a eliminar', type: String })
  @ApiOkResponse({ description: 'Propietario de nicho eliminado exitosamente' })
  @ApiNotFoundResponse({ description: 'Propietario de nicho no encontrado' })
  remove(@Param('id') id: string) {
    return this.propietariosService.remove(id);
  }
}