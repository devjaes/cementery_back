import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { NichoService } from './nicho.service';
import { CreateNichoDto } from './dto/create-nicho.dto';
import { UpdateNichoDto } from './dto/update-nicho.dto';
import { HabilitarNichoDto } from './dto/habilitar-nicho.dto';
import { AmpliarMausoleoDto } from './dto/ampliar-mausoleo.dto';
import { UpdateAmpliacionDto } from './dto/update-ampliacion.dto';
import { TipoNicho } from './enum/tipoNicho.enum';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiResponse,
  ApiQuery,
  ApiConsumes,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

@ApiTags('nichos')
@Controller('nichos')
export class NichosController {
  constructor(private readonly nichosService: NichoService) { }

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo nicho manualmente',
    description:
      'NOTA: Normalmente los nichos se crean automáticamente al crear un bloque. Este endpoint es para casos especiales.',
  })
  @ApiBody({
    type: CreateNichoDto,
    examples: {
      soloRequeridos: {
        summary: 'Solo campos requeridos',
        value: {
          id_cementerio: '123e4567-e89b-12d3-a456-426614174000',
          fila: 1,
          columna: 5,
        },
      },
      conOpcionales: {
        summary: 'Con campos opcionales',
        value: {
          id_cementerio: '123e4567-e89b-12d3-a456-426614174000',
          fila: 2,
          columna: 3,
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Nicho creado exitosamente' })
  create(@Body() createNichoDto: CreateNichoDto) {
    return this.nichosService.create(createNichoDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los nichos por ID de cementerio o todos los nichos',
  })
  @ApiQuery({
    name: 'idCementerio',
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del cementerio',
    required: false,
  })
  findAll(@Query('idCementerio') idCementerio?: string) {
    return this.nichosService.findAll(idCementerio);
  }

  @Post(':id/habilitar')
  @ApiOperation({ summary: 'Habilitar un nicho deshabilitado' })
  @ApiParam({
    name: 'id',
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del nicho a habilitar',
  })
  @ApiBody({
    type: HabilitarNichoDto,
    examples: {
      ejemplo1: {
        summary: 'Nicho básico (huecos ilimitados)',
        value: {
          tipo: TipoNicho.NICHO,
          num_huecos: 2,
        },
      },
      ejemplo2: {
        summary: 'Mausoleo con detalles (huecos ilimitados)',
        value: {
          tipo: TipoNicho.MAUSOLEO,
          num_huecos: 4,
          fecha_construccion: '2024-01-15',
          observaciones: 'Mausoleo familiar con acabados especiales',
        },
      },
      ejemplo3: {
        summary: 'Fosa (solo 1 hueco permitido)',
        value: {
          tipo: TipoNicho.FOSA,
          num_huecos: 1,
          observaciones: 'Fosa individual',
        },
      },
      ejemplo4: {
        summary: 'Bóveda (solo 1 hueco permitido)',
        value: {
          tipo: TipoNicho.BOVEDA,
          num_huecos: 1,
          fecha_construccion: '2024-01-20',
          observaciones: 'Bóveda familiar',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Nicho habilitado exitosamente con sus huecos creados',
  })
  @ApiResponse({
    status: 400,
    description: 'El nicho ya está habilitado, datos inválidos o restricciones de tipo incumplidas (Fosa/Bóveda solo permiten 1 hueco)',
  })
  @ApiResponse({
    status: 404,
    description: 'Nicho no encontrado',
  })
  habilitarNicho(
    @Param('id') id: string,
    @Body() habilitarDto: HabilitarNichoDto,
  ) {
    return this.nichosService.habilitarNicho(id, habilitarDto);
  }

  @Get('fallecidos/:busqueda')
  @ApiOperation({
    summary:
      'Buscar fallecidos en nichos por cédula, nombres o apellidos (búsqueda parcial)',
  })
  @ApiParam({
    name: 'busqueda',
    example: 'Pablo',
    description:
      'Término de búsqueda para cédula, nombres o apellidos del fallecido',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de fallecidos encontrados en nichos',
  })
  findFallecidos(@Param('busqueda') busqueda: string) {
    return this.nichosService.findByBusquedaFallecido(busqueda);
  }

  @Get('propietarios/:id')
  @ApiOperation({
    summary: 'Obtener propietarios de un nicho por ID del nicho',
  })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Lista de propietarios del nicho' })
  findPropietarios(@Param('id') id: string) {
    return this.nichosService.findPropietariosNicho(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un nicho por ID' })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Detalles del nicho' })
  @ApiResponse({ status: 404, description: 'Nicho no encontrado' })
  findOne(@Param('id') id: string) {
    return this.nichosService.findOne(id);
  }

  @Patch(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Actualizar un nicho' })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({
    type: UpdateNichoDto,
    examples: {
      ejemplo1: {
        value: {
          tipo: 'Mausoleo',
          observaciones: 'Actualizado con nuevas especificaciones',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Nicho actualizado' })
  @ApiResponse({ status: 404, description: 'Nicho no encontrado' })
  update(@Param('id') id: string, @Body() updateDto: UpdateNichoDto) {
    return this.nichosService.update(id, updateDto);
  }

  @Delete(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Eliminar un nicho' })
  @ApiParam({ name: 'id', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Nicho eliminado' })
  @ApiResponse({ status: 404, description: 'Nicho no encontrado' })
  remove(@Param('id') id: string) {
    return this.nichosService.remove(id);
  }

  @Post('mausoleo/:id_bloque/ampliar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Ampliar un mausoleo agregando nuevas filas de nichos' })
  @ApiParam({
    name: 'id_bloque',
    description: 'ID del bloque/mausoleo a ampliar',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['numero_filas', 'numero_columnas', 'observacion_ampliacion', 'file'],
      properties: {
        numero_filas: {
          type: 'integer',
          description: 'Número de filas a agregar',
          example: 2,
        },
        numero_columnas: {
          type: 'integer',
          description: 'Número de columnas (debe coincidir con el original)',
          example: 3,
        },
        observacion_ampliacion: {
          type: 'string',
          description: 'Observación sobre la ampliación',
          example: 'Ampliación autorizada por resolución municipal',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo PDF de la autorización (obligatorio)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Mausoleo ampliado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o bloque no es mausoleo' })
  @ApiResponse({ status: 404, description: 'Bloque no encontrado' })
  ampliarMausoleo(
    @Param('id_bloque') id_bloque: string,
    @Body() ampliarDto: AmpliarMausoleoDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.nichosService.ampliarMausoleo(id_bloque, ampliarDto, file);
  }

  @Get(':id_nicho/ampliacion')
  @ApiOperation({
    summary: 'Obtener información de ampliación de un nicho específico',
    description: 'Retorna el número, observación y PDF de ampliación de un nicho'
  })
  @ApiParam({
    name: 'id_nicho',
    description: 'ID del nicho',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Información de ampliación del nicho',
    schema: {
      example: {
        id_nicho: '456e4567-e89b-12d3-a456-426614174001',
        numero: '10',
        observacion_ampliacion: 'Ampliación autorizada 2024',
        pdf_ampliacion: '/uploads/ampliaciones/AMP-2024-xxx/ampliacion_xxx.pdf',
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Nicho no encontrado o no tiene datos de ampliación' })
  getAmpliacionNicho(@Param('id_nicho') id_nicho: string) {
    return this.nichosService.getAmpliacionNicho(id_nicho);
  }

  @Get('ampliaciones/:id_bloque')
  @ApiOperation({
    summary: 'Obtener todos los nichos de ampliación de un mausoleo',
    description: 'Retorna los nichos que fueron creados por ampliaciones, incluyendo observación y PDF'
  })
  @ApiParam({
    name: 'id_bloque',
    description: 'ID del bloque/mausoleo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de nichos de ampliación con sus datos',
    schema: {
      example: {
        id_bloque: '123e4567-e89b-12d3-a456-426614174000',
        nombre_bloque: 'Mausoleo Familiar',
        total_ampliaciones: 6,
        nichos: [
          {
            id_nicho: '456e4567-e89b-12d3-a456-426614174001',
            numero: '10',
            fila: 4,
            columna: 1,
            num_huecos: 1,
            observacion_ampliacion: 'Ampliación autorizada 2024',
            pdf_ampliacion: '/uploads/ampliaciones/AMP-2024-xxx/ampliacion_xxx.pdf',
            fecha_construccion: '2024-01-15T10:30:00.000Z',
          }
        ]
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Bloque no encontrado' })
  getAmpliaciones(@Param('id_bloque') id_bloque: string) {
    return this.nichosService.getAmpliacionesByBloque(id_bloque);
  }

  @Get('ampliacion/:id_nicho/pdf')
  @ApiOperation({
    summary: 'Descargar el PDF de ampliación de un nicho',
    description: 'Descarga el archivo PDF asociado a la ampliación del nicho'
  })
  @ApiParam({
    name: 'id_nicho',
    description: 'ID del nicho',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo PDF',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Nicho no encontrado o no tiene PDF de ampliación' })
  async downloadPdfAmpliacion(@Param('id_nicho') id_nicho: string, @Res() res: Response) {
    return this.nichosService.downloadPdfAmpliacion(id_nicho, res);
  }

  @Patch('ampliacion/:id_nicho')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Actualizar información de ampliación de un nicho',
    description: 'Permite actualizar la observación y/o el PDF de ampliación de un nicho. Se puede actualizar uno o ambos campos.'
  })
  @ApiParam({
    name: 'id_nicho',
    description: 'ID del nicho a actualizar',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        observacion_ampliacion: {
          type: 'string',
          description: 'Nueva observación sobre la ampliación (opcional)',
          example: 'Ampliación actualizada - documentación revisada',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Nuevo archivo PDF de la autorización (opcional)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Ampliación actualizada exitosamente',
    schema: {
      example: {
        mensaje: 'Ampliación actualizada exitosamente',
        nicho: {
          id_nicho: '456e4567-e89b-12d3-a456-426614174001',
          numero: '10',
          observacion_ampliacion: 'Ampliación actualizada - documentación revisada',
          pdf_ampliacion: '/uploads/ampliaciones/AMP-2025-xxx/ampliacion_xxx.pdf',
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Nicho no tiene datos de ampliación o no se proporcionó ningún campo para actualizar'
  })
  @ApiNotFoundResponse({ description: 'Nicho no encontrado' })
  updateAmpliacion(
    @Param('id_nicho') id_nicho: string,
    @Body() updateDto: UpdateAmpliacionDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.nichosService.updateAmpliacion(id_nicho, updateDto, file);
  }
}
