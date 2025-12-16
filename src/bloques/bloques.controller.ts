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
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { BloquesService } from './bloques.service';
import { CreateBloqueDto } from './dto/create-bloque.dto';
import { UpdateBloqueDto } from './dto/update-bloque.dto';
import { AmpliarBloqueDto } from './dto/ampliar-bloque.dto';
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
  ApiConsumes,
} from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Bloques')
@Controller('bloques')
export class BloquesController {
  constructor(private readonly bloquesService: BloquesService) { }

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

  @Post(':id/ampliar-bloque')
  @ApiOperation({
    summary: 'Ampliar un mausoleo agregando nuevas filas de nichos',
    description:
      'Permite ampliar un bloque tipo Mausoleo de forma vertical. Solo se agregan filas, el número de columnas debe coincidir con el original. Requiere un archivo PDF obligatorio.',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiParam({
    name: 'id',
    description: 'ID del bloque (mausoleo) a ampliar',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    description: 'Datos de ampliación con PDF obligatorio',
    schema: {
      type: 'object',
      properties: {
        numero_filas: {
          type: 'integer',
          minimum: 1,
          description: 'Número de filas a agregar',
          example: 2,
        },
        numero_columnas: {
          type: 'integer',
          minimum: 1,
          description: 'Número de columnas (debe coincidir con el original)',
          example: 3,
        },
        observacion_ampliacion: {
          type: 'string',
          maxLength: 1000,
          description: 'Observación sobre la ampliación',
          example: 'Ampliación autorizada por la familia, construcción fase 2',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF de ampliación (obligatorio)',
        },
      },
      required: ['numero_filas', 'numero_columnas', 'observacion_ampliacion', 'file'],
    },
  })
  @ApiOkResponse({
    description: 'Mausoleo ampliado exitosamente',
    schema: {
      example: {
        mensaje: 'Mausoleo ampliado exitosamente',
        bloque: {
          id_bloque: '123e4567-e89b-12d3-a456-426614174000',
          nombre: 'Mausoleo Familiar García',
          numero_filas_anterior: 3,
          numero_filas_nuevo: 5,
          numero_columnas: 3,
        },
        ampliacion: {
          filas_agregadas: 2,
          nichos_creados: 6,
          huecos_creados: 6,
          rango_numeros: '10 - 15',
          observacion: 'Ampliación autorizada por la familia',
          pdf: '/uploads/ampliaciones/AMP-2024-1702745123456/ampliacion_1702745123456.pdf',
          codigo_ampliacion: 'AMP-2024-1702745123456',
        },
        total_nichos_bloque: 15,
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'El bloque no es un mausoleo, el número de columnas no coincide, falta el archivo PDF o el archivo no es un PDF válido',
  })
  @ApiNotFoundResponse({ description: 'Bloque no encontrado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  ampliarBloque(
    @Param('id') id: string,
    @Body() ampliarBloqueDto: AmpliarBloqueDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.bloquesService.ampliarBloque(id, ampliarBloqueDto, file);
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