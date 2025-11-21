import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { MejorasService } from './mejoras.service';
import { CreateMejoraDto } from './dto/create-mejora.dto';
import { UpdateMejoraDto } from './dto/update-mejora.dto';
import { AprobarMejoraDto } from './dto/aprobar-mejora.dto';
import { Response } from 'express';
import { StreamableFile } from '@nestjs/common';

@ApiTags('Mejoras')
@ApiBearerAuth()
@Controller('mejoras')
export class MejorasController {
  constructor(private readonly mejorasService: MejorasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una solicitud de mejora' })
  @ApiCreatedResponse({ description: 'Mejora creada correctamente' })
  create(@Body() dto: CreateMejoraDto) {
    return this.mejorasService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar solicitudes de mejoras' })
  findAll() {
    return this.mejorasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una mejora por ID' })
  @ApiParam({ name: 'id', description: 'Identificador de la mejora' })
  @ApiOkResponse({ description: 'Mejora encontrada' })
  @ApiNotFoundResponse({ description: 'Mejora no encontrada' })
  findOne(@Param('id') id: string) {
    return this.mejorasService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una mejora existente' })
  @ApiParam({ name: 'id', description: 'Identificador de la mejora' })
  @ApiBody({ type: UpdateMejoraDto })
  update(@Param('id') id: string, @Body() dto: UpdateMejoraDto) {
    return this.mejorasService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una mejora' })
  remove(@Param('id') id: string) {
    return this.mejorasService.remove(id);
  }

  @Patch(':id/aprobar')
  @ApiOperation({ summary: 'Registrar aprobación de la mejora' })
  @ApiParam({ name: 'id', description: 'Identificador de la mejora' })
  aprobar(@Param('id') id: string, @Body() body: AprobarMejoraDto) {
    return this.mejorasService.aprobar(id, body.aprobadoPorId);
  }

  @Get(':id/formulario')
  @ApiOperation({ summary: 'Generar el formulario PDF de la mejora' })
  @ApiParam({ name: 'id', description: 'Identificador de la mejora' })
  @ApiOkResponse({
    description: 'PDF generado',
    content: {
      'application/pdf': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  async generarFormulario(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { buffer, filename } = await this.mejorasService.generarFormulario(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    return new StreamableFile(buffer);
  }
}
