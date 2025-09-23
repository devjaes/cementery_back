import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PersonasService } from './personas.service';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import { Persona } from './entities/persona.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBearerAuth
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiBearerAuth()
@ApiTags('Personas')
@Controller('personas')
export class PersonasController {
  constructor(private readonly personasService: PersonasService) {}

  @Post()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Crear nueva persona', description: 'Registra una nueva persona en el sistema' })
  @ApiBody({ 
    type: CreatePersonaDto,
    examples: {
      fallecido: {
        summary: 'Persona fallecida',
        value: {
          cedula: '1801234567',
          nombres: 'María Esperanza',
          apellidos: 'González Pérez',
          fecha_nacimiento: '1945-03-12',
          fecha_defuncion: '2020-08-15',
          fecha_inhumacion: '2020-08-20',
          lugar_defuncion: 'Hospital Provincial Ambato',
          causa_defuncion: 'Causas naturales - Edad avanzada',
          nacionalidad: 'Ecuatoriana',
          fallecido: true
        }
      },
      vivo: {
        summary: 'Persona viva',
        value: {
          cedula: '1802345678',
          nombres: 'José Antonio',
          apellidos: 'Ramírez Silva',
          direccion: 'Av. Cevallos 456, Centro',
          telefono: '032-834567',
          correo: 'jose.ramirez@email.com',
          fallecido: false
        }
      }
    }
  })
  @ApiCreatedResponse({ 
    description: 'Persona creada exitosamente',
    type: Persona
  })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos' })
  create(@Body() createPersonaDto: CreatePersonaDto) {
    return this.personasService.create(createPersonaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las personas', description: 'Devuelve una lista de todas las personas registradas' })
  @ApiOkResponse({ 
    description: 'Lista de personas obtenida exitosamente',
    type: [Persona]
  })
  findAll() {
    return this.personasService.findAll();
  }

  @Get('search')
  @ApiOperation({ 
    summary: 'Buscar personas', 
    description: 'Busca personas por cédula, nombres o apellidos. Opcionalmente filtra por estado vivo/fallecido.' 
  })
  @ApiQuery({ 
    name: 'query', 
    required: false, 
    description: 'Término de búsqueda (cédula, nombres o apellidos)' 
  })
  @ApiQuery({ 
    name: 'vivos', 
    required: false, 
    type: Boolean,
    description: 'Filtrar por estado: true=vivos, false=fallecidos, sin especificar=todos' 
  })
  @ApiOkResponse({ 
    description: 'Resultados de la búsqueda',
    type: [Persona]
  })
  async search(
    @Query('query') query?: string,
    @Query('vivos') vivosParam?: string
  ): Promise<Persona[]> {
    // Convertir string a boolean correctamente
    let vivos: boolean | undefined;
    if (vivosParam !== undefined) {
      vivos = vivosParam === 'true';
    }
    
    return this.personasService.findBy(query, vivos);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener persona por ID', description: 'Obtiene los detalles de una persona específica' })
  @ApiParam({ name: 'id', description: 'ID de la persona', type: String })
  @ApiOkResponse({ 
    description: 'Persona encontrada',
    type: Persona
  })
  @ApiNotFoundResponse({ description: 'Persona no encontrada' })
  findOne(@Param('id') id: string) {
    return this.personasService.findOne(id);
  }

  @Patch(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Actualizar persona', description: 'Actualiza la información de una persona existente' })
  @ApiParam({ name: 'id', description: 'ID de la persona a actualizar', type: String })
  @ApiBody({ type: UpdatePersonaDto })
  @ApiOkResponse({ 
    description: 'Persona actualizada exitosamente',
    type: Persona
  })
  @ApiNotFoundResponse({ description: 'Persona no encontrada' })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos' })
  update(@Param('id') id: string, @Body() updatePersonaDto: UpdatePersonaDto) {
    return this.personasService.update(id, updatePersonaDto);
  }

  @Delete(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Eliminar persona', description: 'Elimina una persona del sistema' })
  @ApiParam({ name: 'id', description: 'ID de la persona a eliminar', type: String })
  @ApiOkResponse({ description: 'Persona eliminada exitosamente' })
  @ApiNotFoundResponse({ description: 'Persona no encontrada' })
  remove(@Param('id') id: string) {
    return this.personasService.remove(id);
  }
}