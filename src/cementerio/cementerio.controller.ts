import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CementerioService } from './cementerio.service';
import { CreateCementerioDto } from './dto/create-cementerio.dto';
import { UpdateCementerioDto } from './dto/update-cementerio.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse
} from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Cementerios')
@Controller('cementerio')
export class CementerioController {
  constructor(private readonly cementerioService: CementerioService) {}

  @Post()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Crear nuevo cementerio' })
  @ApiBody({ type: CreateCementerioDto })
  @ApiCreatedResponse({ 
    description: 'Cementerio creado exitosamente',
    type: CreateCementerioDto 
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiForbiddenResponse({ description: 'Acceso prohibido' })
  create(@Body() createCementerioDto: CreateCementerioDto) {
    return this.cementerioService.create(createCementerioDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los cementerios' })
  @ApiOkResponse({ 
    description: 'Lista de cementerios obtenida',
    type: [CreateCementerioDto]
  })
  findAll() {
    return this.cementerioService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cementerio por ID' })
  @ApiParam({ 
    name: 'id', 
    description: 'ID del cementerio',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiOkResponse({ 
    description: 'Cementerio encontrado',
    type: CreateCementerioDto
  })
  @ApiNotFoundResponse({ description: 'Cementerio no encontrado' })
  findOne(@Param('id') id: string) {
    return this.cementerioService.findOne(id);
  }

  @Get('nombre/:nombre')
  @ApiOperation({ summary: 'Buscar cementerio por nombre' })
  @ApiParam({ 
    name: 'nombre', 
    description: 'Nombre del cementerio',
    example: 'Cementerio Municipal'
  })
  @ApiOkResponse({ 
    description: 'Cementerio(s) encontrado(s)',
    type: [CreateCementerioDto]
  })
  findByNombre(@Param('nombre') nombre: string) {
    return this.cementerioService.findByName(nombre);
  }

  @Patch(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Actualizar cementerio' })
  @ApiParam({ 
    name: 'id', 
    description: 'ID del cementerio a actualizar',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({ type: UpdateCementerioDto })
  @ApiOkResponse({ 
    description: 'Cementerio actualizado exitosamente',
    type: UpdateCementerioDto
  })
  @ApiNotFoundResponse({ description: 'Cementerio no encontrado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiForbiddenResponse({ description: 'Acceso prohibido' })
  update(@Param('id') id: string, @Body() updateCementerioDto: UpdateCementerioDto) {
    return this.cementerioService.update(id, updateCementerioDto);
  }

  @Delete(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Eliminar cementerio' })
  @ApiParam({ 
    name: 'id', 
    description: 'ID del cementerio a eliminar',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiOkResponse({ description: 'Cementerio eliminado exitosamente' })
  @ApiNotFoundResponse({ description: 'Cementerio no encontrado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiForbiddenResponse({ description: 'Acceso prohibido' })
  remove(@Param('id') id: string) {
    return this.cementerioService.remove(id);
  }
}