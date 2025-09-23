import { Controller, Get, Post, Body, Param, Delete, Put, Patch, UseGuards } from '@nestjs/common';
import { NichoService } from './nicho.service';
import { CreateNichoDto } from './dto/create-nicho.dto';
import { UpdateNichoDto } from './dto/update-nicho.dto';
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiResponse } from '@nestjs/swagger';


@ApiTags('nichos')
@Controller('nichos')
export class NichosController {
  constructor(private readonly nichosService: NichoService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo nicho' })
  @ApiBody({
    type: CreateNichoDto,
    examples: {
      soloRequeridos: {
        summary: 'Solo campos requeridos',
        value: {
          id_cementerio: "123e4567-e89b-12d3-a456-426614174000",
          sector: "A",
          fila: "1",
          numero: "15",
          tipo: "Nicho",
          fecha_construccion: "2023-01-01",
          num_huecos: 2
        }
      },
      conOpcionales: {
        summary: 'Con campos opcionales',
        value: {
          id_cementerio: "123e4567-e89b-12d3-a456-426614174000",
          sector: "B",
          fila: "2",
          numero: "20",
          tipo: "Fosa",
          fecha_construccion: "2022-05-10",
          // fecha_adquisicion: "2022-06-01",
          observaciones: "Construido recientemente con mármol importado",
          num_huecos: 4,
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Nicho creado exitosamente' })
  create(@Body() createNichoDto: CreateNichoDto) {
    return this.nichosService.create(createNichoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los nichos' })
  @ApiResponse({ status: 200, description: 'Lista de nichos' })
  findAll() {
    return this.nichosService.findAll();
  }

  @Get('fallecidos/:busqueda')
  @ApiOperation({ summary: 'Buscar fallecidos en nichos por cédula, nombres o apellidos (búsqueda parcial)' })
  @ApiParam({ 
    name: 'busqueda', 
    example: 'Pablo',
    description: 'Término de búsqueda para cédula, nombres o apellidos del fallecido'
  })
  @ApiResponse({ status: 200, description: 'Lista de fallecidos encontrados en nichos' })
  findFallecidos(@Param('busqueda') busqueda: string) {
    return this.nichosService.findByBusquedaFallecido(busqueda);
  }

  @Get('propietarios/:id')
  @ApiOperation({ summary: 'Obtener propietarios de un nicho por ID del nicho' })
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
          sector: "B",
          fila: "2",
          numero: "20"
        }
      }
    }
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

}