import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
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
import * as fs from 'fs';
import * as path from 'path';
import type { Express } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

const DOCUMENT_ROOT = path.join(process.cwd(), 'uploads', 'mejoras');
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DOCUMENT_FILES = 6;

const documentStorage = diskStorage({
  destination: (req, _file, cb) => {
    const mejoraId = req.params.id;
    if (!mejoraId) {
      cb(new BadRequestException('Falta el identificador de la mejora'), '');
      return;
    }
    const target = path.join(DOCUMENT_ROOT, mejoraId);
    fs.mkdirSync(target, { recursive: true });
    cb(null, target);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  },
});

const pdfFileFilter = (_req: unknown, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
  const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    cb(new BadRequestException('Solo se permiten archivos PDF'), false);
    return;
  }
  cb(null, true);
};

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

  @Post(':id/files')
  @ApiOperation({ summary: 'Subir documentos PDF de respaldo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Documentos PDF relacionados con la solicitud',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', MAX_DOCUMENT_FILES, {
      storage: documentStorage,
      fileFilter: pdfFileFilter,
      limits: { fileSize: MAX_DOCUMENT_SIZE },
    }),
  )
  uploadFiles(@Param('id') id: string, @UploadedFiles() files: Express.Multer.File[]) {
    return this.mejorasService.uploadDocuments(id, files);
  }

  @Get(':id/files')
  @ApiOperation({ summary: 'Listar documentos PDF adjuntos' })
  @ApiOkResponse({ description: 'Metadatos de los archivos adjuntos' })
  listDocuments(@Param('id') id: string) {
    return this.mejorasService.listDocuments(id);
  }

  @Get(':id/files/:filename')
  @ApiOperation({ summary: 'Descargar documento PDF' })
  @ApiOkResponse({
    content: {
      'application/pdf': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Documento no encontrado' })
  async downloadDocument(
    @Param('id') id: string,
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { metadata, filePath } = await this.mejorasService.getDocumentFile(id, filename);
    res.setHeader('Content-Type', metadata.contentType ?? 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${metadata.originalName.replace(/"/g, '')}"`);
    res.setHeader('Content-Length', metadata.size.toString());
    return new StreamableFile(fs.createReadStream(filePath));
  }

  @Delete(':id/files/:filename')
  @ApiOperation({ summary: 'Eliminar un documento PDF adjunto' })
  @ApiParam({ name: 'filename', description: 'Nombre interno del archivo' })
  @ApiOkResponse({ description: 'Documento eliminado' })
  @ApiNotFoundResponse({ description: 'Documento no encontrado' })
  deleteDocument(@Param('id') id: string, @Param('filename') filename: string) {
    return this.mejorasService.deleteDocument(id, filename);
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
