import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mejora } from './entities/mejora.entity';
import { CreateMejoraDto } from './dto/create-mejora.dto';
import { UpdateMejoraDto } from './dto/update-mejora.dto';
import { Nicho } from 'src/nicho/entities/nicho.entity';
import { Persona } from 'src/personas/entities/persona.entity';
import { User } from 'src/user/entities/user.entity';
import { MejorasPdfService } from './mejoras-pdf.service';
import * as fs from 'fs';
import * as path from 'path';
import type { Express } from 'express';

@Injectable()
export class MejorasService {
  constructor(
    @InjectRepository(Mejora)
    private readonly mejoraRepository: Repository<Mejora>,
    @InjectRepository(Nicho)
    private readonly nichoRepository: Repository<Nicho>,
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly pdfService: MejorasPdfService,
  ) {}

  async create(dto: CreateMejoraDto) {
    try {
      const nicho = await this.lookupNicho(dto.id_nicho);
      const solicitante = await this.lookupPersona(dto.id_solicitante);
      const fallecido = dto.id_fallecido
        ? await this.lookupPersona(dto.id_fallecido)
        : undefined;

      const mejora = this.mejoraRepository.create({
        codigo: this.generarCodigo(),
        metodoSolicitud: dto.metodoSolicitud,
        codigoAutorizacion: dto.codigoAutorizacion ?? this.generarCodigoAutorizacion(),
        entidad: dto.entidad ?? 'GADM Santiago de Pillaro',
        direccionEntidad: dto.direccionEntidad,
        panteoneroACargo: dto.panteoneroACargo,
        solicitanteDireccion: dto.solicitanteDireccion ?? solicitante?.direccion,
        solicitanteCorreo: dto.solicitanteCorreo ?? solicitante?.correo,
        solicitanteTelefono: dto.solicitanteTelefono ?? solicitante?.telefono,
        observacionSolicitante: dto.observacionSolicitante,
        propietarioNombre: dto.propietarioNombre,
        propietarioFechaAdquisicion: dto.propietarioFechaAdquisicion
          ? new Date(dto.propietarioFechaAdquisicion)
          : nicho?.propietarios_nicho?.[0]?.fecha_adquisicion,
        propietarioTipoTenencia: dto.propietarioTipoTenencia,
        administradorNicho: dto.administradorNicho,
        tipoServicio: dto.tipoServicio,
        observacionServicio: dto.observacionServicio,
        fechaInicio: this.parseRequiredDate(
          dto.fechaInicio,
          'fechaInicio',
          'La fecha de inicio es requerida',
          'La fecha de inicio debe tener un formato válido',
        ),
        fechaFin: this.parseRequiredDate(
          dto.fechaFin,
          'fechaFin',
          'La fecha de finalización es requerida',
          'La fecha de finalización debe tener un formato válido',
        ),
        horarioTrabajo: dto.horarioTrabajo,
        condicion: dto.condicion,
        autorizacionTexto: dto.autorizacionTexto,
        normativaAplicable: dto.normativaAplicable,
        obligacionesPostObra: dto.obligacionesPostObra,
        escombreraMunicipal: dto.escombreraMunicipal,
        nicho,
        solicitante,
        fallecido,
      });

      return await this.mejoraRepository.save(mejora);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Error al crear la mejora: ${error.message ?? error}`,
      );
    }
  }

  async findAll() {
    return this.mejoraRepository.find({
      relations: ['nicho', 'solicitante', 'fallecido', 'aprobadoPor'],
    });
  }

  async findOne(id: string) {
    const mejora = await this.mejoraRepository.findOne({
      where: { id_mejora: id },
      relations: ['nicho', 'solicitante', 'fallecido', 'aprobadoPor'],
    });

    if (!mejora) {
      throw new NotFoundException(`Mejora con ID ${id} no encontrada`);
    }

    return mejora;
  }

  async update(id: string, dto: UpdateMejoraDto) {
    try {
      const mejora = await this.findOne(id);

      if (dto.id_nicho && dto.id_nicho !== mejora.nicho.id_nicho) {
        mejora.nicho = await this.lookupNicho(dto.id_nicho);
      }

      if (dto.id_solicitante && dto.id_solicitante !== mejora.solicitante.id_persona) {
        mejora.solicitante = await this.lookupPersona(dto.id_solicitante);
      }

      if (dto.id_fallecido) {
        mejora.fallecido = await this.lookupPersona(dto.id_fallecido);
      }

      Object.assign(mejora, {
        metodoSolicitud: dto.metodoSolicitud ?? mejora.metodoSolicitud,
        codigoAutorizacion: dto.codigoAutorizacion ?? mejora.codigoAutorizacion,
        entidad: dto.entidad ?? mejora.entidad,
        direccionEntidad: dto.direccionEntidad ?? mejora.direccionEntidad,
        panteoneroACargo: dto.panteoneroACargo ?? mejora.panteoneroACargo,
        solicitanteDireccion:
          dto.solicitanteDireccion ?? mejora.solicitanteDireccion,
        solicitanteCorreo: dto.solicitanteCorreo ?? mejora.solicitanteCorreo,
        solicitanteTelefono:
          dto.solicitanteTelefono ?? mejora.solicitanteTelefono,
        observacionSolicitante:
          dto.observacionSolicitante ?? mejora.observacionSolicitante,
        propietarioNombre: dto.propietarioNombre ?? mejora.propietarioNombre,
        propietarioFechaAdquisicion: dto.propietarioFechaAdquisicion
          ? new Date(dto.propietarioFechaAdquisicion)
          : mejora.propietarioFechaAdquisicion,
        propietarioTipoTenencia:
          dto.propietarioTipoTenencia ?? mejora.propietarioTipoTenencia,
        administradorNicho: dto.administradorNicho ?? mejora.administradorNicho,
        tipoServicio: dto.tipoServicio ?? mejora.tipoServicio,
        observacionServicio:
          dto.observacionServicio ?? mejora.observacionServicio,
        fechaInicio: dto.fechaInicio
          ? new Date(dto.fechaInicio)
          : mejora.fechaInicio,
        fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : mejora.fechaFin,
        horarioTrabajo: dto.horarioTrabajo ?? mejora.horarioTrabajo,
        condicion: dto.condicion ?? mejora.condicion,
        autorizacionTexto: dto.autorizacionTexto ?? mejora.autorizacionTexto,
        normativaAplicable: dto.normativaAplicable ?? mejora.normativaAplicable,
        obligacionesPostObra:
          dto.obligacionesPostObra ?? mejora.obligacionesPostObra,
        escombreraMunicipal:
          dto.escombreraMunicipal ?? mejora.escombreraMunicipal,
      });

      return await this.mejoraRepository.save(mejora);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Error al actualizar la mejora: ${error.message ?? error}`,
      );
    }
  }

  async remove(id: string) {
    const mejora = await this.findOne(id);
    return this.mejoraRepository.remove(mejora);
  }

  async aprobar(id: string, aprobadoPorId: string) {
    const mejora = await this.findOne(id);
    const usuario = await this.lookupUsuario(aprobadoPorId);

    mejora.aprobado = true;
    mejora.aprobadoPor = usuario;
    mejora.fechaAprobacion = new Date();
    mejora.estado = 'Aprobado';

    return this.mejoraRepository.save(mejora);
  }

  async negar(id: string, negadoPorId: string) {
    const mejora = await this.findOne(id);
    await this.lookupUsuario(negadoPorId);

    mejora.aprobado = false;
    mejora.aprobadoPor = undefined;
    mejora.fechaAprobacion = undefined;
    mejora.estado = 'Negado';

    return this.mejoraRepository.save(mejora);
  }

  async generarFormulario(id: string) {
    const mejora = await this.findOne(id);
    const buffer = await this.pdfService.build(mejora);
    const filename = `mejora_${mejora.codigo}.pdf`;

    return { buffer, filename };
  }

  async uploadDocuments(id: string, files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Debes adjuntar al menos un archivo PDF');
    }

    const mejora = await this.findOne(id);
    const documentos = [...(mejora.documentos ?? [])];

    files.forEach((file) => {
      const metadata = {
        filename: file.filename,
        originalName: file.originalname,
        url: `/mejoras/${id}/files/${encodeURIComponent(file.filename)}`,
        uploadedAt: new Date().toISOString(),
        contentType: file.mimetype,
        size: file.size,
      };
      documentos.push(metadata);
    });

    mejora.documentos = documentos;
    await this.mejoraRepository.save(mejora);
    return documentos;
  }

  async listDocuments(id: string) {
    const mejora = await this.findOne(id);
    return mejora.documentos ?? [];
  }

  async getDocumentFile(id: string, filename: string) {
    const documentos = await this.listDocuments(id);
    const document = documentos.find((item) => item.filename === filename);
    if (!document) {
      throw new NotFoundException(`Documento ${filename} no encontrado para esta mejora`);
    }

    const filePath = path.join(this.getDocumentDir(id), filename);
    await fs.promises.access(filePath, fs.constants.R_OK);
    return { metadata: document, filePath };
  }

  async deleteDocument(id: string, filename: string) {
    const mejora = await this.findOne(id);
    const documentos = mejora.documentos ?? [];
    const document = documentos.find((item) => item.filename === filename);
    if (!document) {
      throw new NotFoundException(`Documento ${filename} no encontrado para esta mejora`);
    }

    const filePath = path.join(this.getDocumentDir(id), filename);
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new InternalServerErrorException(`No se pudo eliminar el archivo: ${(error as Error).message}`);
      }
    }

    mejora.documentos = documentos.filter((item) => item.filename !== filename);
    await this.mejoraRepository.save(mejora);
    return mejora.documentos;
  }

  private generarCodigo(): string {
    const now = new Date();
    const year = now.getFullYear();
    const random = Math.floor(100 + Math.random() * 900);
    return `${random}-${year}-CMC-MEJ`;
  }

  private generarCodigoAutorizacion(): string {
    const now = new Date();
    const year = now.getFullYear();
    const random = Math.floor(100 + Math.random() * 900);
    return `${random}-${year}`;
  }

  private parseRequiredDate(
    value: string | undefined,
    fieldKey: string,
    requiredMessage: string,
    invalidMessage: string,
  ) {
    if (!value || value.trim() === '') {
      throw new BadRequestException(`${fieldKey}: ${requiredMessage}`);
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${fieldKey}: ${invalidMessage}`);
    }

    return parsed;
  }

  private async lookupNicho(id: string) {
    const nicho = await this.nichoRepository.findOne({
      where: { id_nicho: id },
      relations: ['id_cementerio', 'propietarios_nicho'],
    });
    if (!nicho) {
      throw new NotFoundException(`Nicho con ID ${id} no encontrado`);
    }
    return nicho;
  }

  private async lookupPersona(id: string) {
    const persona = await this.personaRepository.findOne({
      where: { id_persona: id },
    });
    if (!persona) {
      throw new NotFoundException(`Persona con ID ${id} no encontrada`);
    }
    return persona;
  }

  private async lookupUsuario(id: string) {
    const usuario = await this.userRepository.findOne({
      where: { id_user: id },
    });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return usuario;
  }

  private getDocumentDir(id: string) {
    return path.join(process.cwd(), 'uploads', 'mejoras', id);
  }
}
