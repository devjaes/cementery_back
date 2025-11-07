import { Controller, Post, Get, Patch, Delete, Param, Body, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ExhumacionService } from './exhumacion.service';
import { CreateExhumacionDto } from './dto/create-exhumacion.dto';
import { UpdateExhumacionDto } from './dto/update-exhumacion.dto';

@ApiTags('Exhumaciones')
@Controller('exhumaciones')
export class ExhumacionController {
  constructor(private readonly service: ExhumacionService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('archivos', 4))
  @ApiOperation({ summary: 'Crear nueva exhumación' })
  @ApiResponse({ status: 201, description: 'Exhumación creada exitosamente' })
  @ApiBody({ type: CreateExhumacionDto })
  create(
    @Body() dto: CreateExhumacionDto,
    @UploadedFiles() archivos: Express.Multer.File[]
  ) {
    return this.service.create(dto, archivos);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las exhumaciones' })
  @ApiResponse({ status: 200, description: 'Lista de exhumaciones' })
  findAll() {
    return this.service.findAll();
  }

  @Get('persona/:cedula')
  @ApiOperation({ summary: 'Buscar exhumaciones por cédula de persona' })
  @ApiResponse({ status: 200, description: 'Exhumaciones encontradas por cédula' })
  findByCedula(@Param('cedula') cedula: string) {
    return this.service.findByCedula(cedula);
  }

  // 
  @Patch(':id')
@UseInterceptors(FilesInterceptor('comprobante_pago', 1)) // ← AGREGAR ESTO
@ApiOperation({ summary: 'Actualizar exhumación' })
@ApiResponse({ status: 200, description: 'Exhumación actualizada' })
@ApiBody({ type: UpdateExhumacionDto })
update(
  @Param('id') id: string, 
  @Body() dto: UpdateExhumacionDto,
  @UploadedFiles() comprobante?: Express.Multer.File[] // ← AGREGAR ESTO
) {
  return this.service.update(id, dto, comprobante); // ← PASAR EL ARCHIVO
}

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar exhumación' })
  @ApiResponse({ status: 200, description: 'Exhumación eliminada' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener exhumación por ID' })
  @ApiResponse({ status: 200, description: 'Exhumación encontrada' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
}
}
