import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { BloquesService } from './bloques.service';
import { CreateBloqueDto } from './dto/create-bloque.dto';
import { UpdateBloqueDto } from './dto/update-bloque.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Bloques')
@Controller('bloques')
export class BloquesController {
  constructor(private readonly bloquesService: BloquesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo bloque' })
  @ApiBody({ type: CreateBloqueDto })
  @ApiCreatedResponse({
    description: 'Bloque creado exitosamente',
    type: CreateBloqueDto,
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiForbiddenResponse({ description: 'Acceso prohibido' })
  create(@Body() createBloqueDto: CreateBloqueDto) {
    return this.bloquesService.create(createBloqueDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los bloques' })
  @ApiOkResponse({ description: 'Lista de bloques obtenida exitosamente' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  findAll() {
    return this.bloquesService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar bloques por nombre' })
  @ApiQuery({ name: 'nombre', description: 'Nombre del bloque a buscar' })
  @ApiOkResponse({ description: 'Búsqueda realizada exitosamente' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  search(@Query('nombre') nombre: string) {
    return this.bloquesService.search(nombre);
  }

  @Get('cementerio/:id_cementerio')
  @ApiOperation({ summary: 'Obtener bloques por cementerio' })
  @ApiParam({ name: 'id_cementerio', description: 'ID del cementerio' })
  @ApiOkResponse({ description: 'Bloques del cementerio obtenidos exitosamente' })
  @ApiNotFoundResponse({ description: 'Cementerio no encontrado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  findByCementerio(@Param('id_cementerio') id_cementerio: string) {
    return this.bloquesService.findByCementerio(id_cementerio);
  }

  @Get(':id/nichos')
  @ApiOperation({ summary: 'Obtener nichos de un bloque' })
  @ApiParam({ name: 'id', description: 'ID del bloque' })
  @ApiOkResponse({ description: 'Nichos del bloque obtenidos exitosamente' })
  @ApiNotFoundResponse({ description: 'Bloque no encontrado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  findNichosByBloque(@Param('id') id: string) {
    return this.bloquesService.findNichosByBloque(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener bloque por ID' })
  @ApiParam({ name: 'id', description: 'ID del bloque' })
  @ApiOkResponse({ description: 'Bloque obtenido exitosamente' })
  @ApiNotFoundResponse({ description: 'Bloque no encontrado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  findOne(@Param('id') id: string) {
    return this.bloquesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar bloque' })
  @ApiParam({ name: 'id', description: 'ID del bloque' })
  @ApiBody({ type: UpdateBloqueDto })
  @ApiOkResponse({ description: 'Bloque actualizado exitosamente' })
  @ApiNotFoundResponse({ description: 'Bloque no encontrado' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiForbiddenResponse({ description: 'Acceso prohibido' })
  update(@Param('id') id: string, @Body() updateBloqueDto: UpdateBloqueDto) {
    return this.bloquesService.update(id, updateBloqueDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar bloque' })
  @ApiParam({ name: 'id', description: 'ID del bloque' })
  @ApiOkResponse({ description: 'Bloque eliminado exitosamente' })
  @ApiNotFoundResponse({ description: 'Bloque no encontrado' })
  @ApiBadRequestResponse({ description: 'No se puede eliminar el bloque' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiForbiddenResponse({ description: 'Acceso prohibido' })
  remove(@Param('id') id: string) {
    return this.bloquesService.remove(id);
  }
}