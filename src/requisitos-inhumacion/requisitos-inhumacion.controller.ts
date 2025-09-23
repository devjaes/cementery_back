import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
} from '@nestjs/common';
import { RequisitosInhumacionService } from './requisitos-inhumacion.service';
import { CreateRequisitosInhumacionDto } from './dto/create-requisitos-inhumacion.dto';
import { UpdateRequisitosInhumacionDto } from './dto/update-requisitos-inhumacion.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiConsumes,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { PDFGeneratorService } from 'src/shared/pdf-generator/pdf-generator.service';
import { Response } from 'express';

@ApiTags('Requisitos Inhumacion')
@Controller('requisitos-inhumacion')
export class RequisitosInhumacionController {
  constructor(
    private readonly requisitosInhumacionService: RequisitosInhumacionService,
    private readonly pdfGeneratorService: PDFGeneratorService, 
  ) {}


@Get(':id/pdf')
async generarPDF(@Param('id') id: string, @Res() res: Response) {
  const requisitos = await this.requisitosInhumacionService.findOne(id); 
  // Incluye relaciones
  const pdfPath = await this.pdfGeneratorService.generarPDF(requisitos);
  res.download(pdfPath);
}

  @Post()
  @ApiConsumes('application/json')
  @ApiOperation({ summary: 'Crear un nuevo requisito de inhumación (solo JSON), el link del documento es opcional' })
  @ApiResponse({ status: 201, description: 'Requisito creado correctamente.' })
  @ApiBadRequestResponse({
    description: 'Error al crear el requisito de inhumación.',
  })
  @ApiResponse({
    status: 400,
    description: 'Petición inválida.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Datos inválidos',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Hueco no disponible.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @ApiBody({
    description: 'Datos del requisito en formato JSON',
    type: CreateRequisitosInhumacionDto,
    required: true,
    examples: {
      ejemploCompleto: {
        summary: 'Requisito completo',
        value: {
          id_fallecido: "uuid-fallecido-1",
          id_solicitante: "uuid-solicitante-1",
          id_hueco_nicho: "uuid-hueco-1",
          id_cementerio: "uuid-cementerio-1",
          copiaCertificadoDefuncion: true,
          observacionCertificadoDefuncion: "Certificado válido",
          informeEstadisticoINEC: true,
          observacionInformeEstadisticoINEC: "INEC entregado",
          copiaCedula: true,
          observacionCopiaCedula: "Copia legible",
          pagoTasaInhumacion: true,
          observacionPagoTasaInhumacion: "Pago realizado",
          copiaTituloPropiedadNicho: true,
          observacionCopiaTituloPropiedadNicho: "Título actualizado",
          autorizacionDeMovilizacionDelCadaver: false,
          observacionAutorizacionMovilizacion: "",
          OficioDeSolicitud: true,
          observacionOficioSolicitud: "Oficio firmado",
          fechaInhumacion: "2024-06-26"
        }
      },
      ejemploMinimo: {
        summary: 'Requisito mínimo',
        value: {
          id_fallecido: "uuid-fallecido-2",
          id_solicitante: "uuid-solicitante-2",
          copiaCertificadoDefuncion: true,
          informeEstadisticoINEC: false,
          copiaCedula: true,
          pagoTasaInhumacion: false,
          copiaTituloPropiedadNicho: false,
          autorizacionDeMovilizacionDelCadaver: false,
          OficioDeSolicitud: false,
          fechaInhumacion: "2024-06-26"
        }
      },
      ejemploSoloObligatorios: {
        summary: 'Solo campos obligatorios',
        value: {
          id_fallecido: "uuid-fallecido-3",
          id_solicitante: "uuid-solicitante-3",
          copiaCertificadoDefuncion: true,
          informeEstadisticoINEC: true,
          copiaCedula: true,
          pagoTasaInhumacion: true,
          copiaTituloPropiedadNicho: true,
          autorizacionDeMovilizacionDelCadaver: false,
          OficioDeSolicitud: true,
          fechaInhumacion: "2024-06-26"
        }
      }
    }
  })
  create(
    @Body() dto: CreateRequisitosInhumacionDto,
  ) {
    return this.requisitosInhumacionService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los requisitos de inhumación' })
  @ApiResponse({
    status: 200,
    description: 'Lista de requisitos de inhumación.',
  })
  findAll() {
    return this.requisitosInhumacionService.findAll();
  }

  @Get('/requisito/:id')
  @ApiOperation({ summary: 'Obtener un requisito de inhumación por ID' })
  @ApiParam({ name: 'id', description: 'ID del requisito de inhumación' })
  @ApiResponse({ status: 200, description: 'Requisito encontrado.' })
  @ApiResponse({ status: 404, description: 'Requisito no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.requisitosInhumacionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un requisito de inhumación' })
  @ApiParam({ name: 'id', description: 'ID del requisito de inhumación' })
  @ApiBody({
    description: 'Datos del requisito en formato JSON',
    schema: {
      type: 'object',
      properties: {
        copiaCertificadoDefuncion: { type: 'boolean', example: true },
        observacionCertificadoDefuncion: { type: 'string', example: 'Observación sobre el certificado de defunción' },
        informeEstadisticoINEC: { type: 'boolean', example: false },
        observacionInformeEstadisticoINEC: { type: 'string', example: 'Observación sobre el informe estadístico INEC' },
        copiaCedula: { type: 'boolean', example: true },
        observacionCopiaCedula: { type: 'string', example: 'Observación sobre la copia de cédula' },
        pagoTasaInhumacion: { type: 'boolean', example: true },
        observacionPagoTasaInhumacion: { type: 'string', example: 'Observación sobre el pago de tasa de inhumación' },
        copiaTituloPropiedadNicho: { type: 'boolean', example: false },
        observacionCopiaTituloPropiedadNicho: { type: 'string', example: 'Observación sobre el título de propiedad del nicho' },
        autorizacionDeMovilizacionDelCadaver: { type: 'boolean', example: false },
        observacionAutorizacionMovilizacion: { type: 'string', example: 'Observación sobre la autorización de movilización del cadáver' },
        OficioDeSolicitud: { type: 'boolean', example: false },
        observacionOficioSolicitud: { type: 'string', example: 'Observación sobre el oficio de solicitud' },
        // Agrega aquí otros campos del DTO si es necesario
      },
      required: [
        'copiaCertificadoDefuncion',
        'observacionCertificadoDefuncion',
        'informeEstadisticoINEC',
        'observacionInformeEstadisticoINEC',
        'copiaCedula',
        'observacionCopiaCedula',
        'pagoTasaInhumacion',
        'observacionPagoTasaInhumacion',
        'copiaTituloPropiedadNicho',
        'observacionCopiaTituloPropiedadNicho',
        'autorizacionDeMovilizacionDelCadaver',
        'observacionAutorizacionMovilizacion',
        'OficioDeSolicitud',
        'observacionOficioSolicitud',
      ],
      example: {
        copiaCertificadoDefuncion: true,
        observacionCertificadoDefuncion: 'Observación sobre el certificado de defunción',
        informeEstadisticoINEC: false,
        observacionInformeEstadisticoINEC: 'Observación sobre el informe estadístico INEC',
        copiaCedula: true,
        observacionCopiaCedula: 'Observación sobre la copia de cédula',
        pagoTasaInhumacion: true,
        observacionPagoTasaInhumacion: 'Observación sobre el pago de tasa de inhumación',
        copiaTituloPropiedadNicho: false,
        observacionCopiaTituloPropiedadNicho: 'Observación sobre el título de propiedad del nicho',
        autorizacionDeMovilizacionDelCadaver: false,
        observacionAutorizacionMovilizacion: 'Observación sobre la autorización de movilización del cadáver',
        OficioDeSolicitud: false,
        observacionOficioSolicitud: 'Observación sobre el oficio de solicitud',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Requisito actualizado correctamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Petición inválida.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Datos inválidos',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Hueco no disponible.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @ApiResponse({ status: 404, description: 'Requisito no encontrado.' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRequisitosInhumacionDto,
  ) {
    return this.requisitosInhumacionService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un requisito de inhumación' })
  @ApiParam({ name: 'id', description: 'ID del requisito de inhumación' })
  @ApiResponse({
    status: 200,
    description: 'Requisito eliminado correctamente.',
  })
  @ApiResponse({ status: 404, description: 'Requisito no encontrado.' })
  remove(@Param('id') id: string) {
    return this.requisitosInhumacionService.remove(id);
  }

  @Get('/cedulaFallecido/:cedula')
  @ApiOperation({ summary: 'Buscar requisitos de inhumación por cédula del fallecido' })
  @ApiParam({ name: 'cedula', description: 'Cédula del fallecido' })
  @ApiResponse({
    status: 200,
    description: 'Requisitos encontrados para el fallecido.',
  })
  @ApiResponse({ status: 404, description: 'Fallecido no encontrado.' })
  findByCedulaFallecido(@Param('cedula') cedula: string) {
    return this.requisitosInhumacionService.findByCedulaFallecido(cedula);
  }

  @Get('/cedulaSolicitante/:cedula')
  @ApiOperation({ summary: 'Buscar requisitos de inhumación por cédula del solicitante' })
  @ApiParam({ name: 'cedula', description: 'Cédula del solicitante' })
  @ApiResponse({
    status: 200,
    description: 'Requisitos encontrados para el fallecido.',
  })
  @ApiResponse({ status: 404, description: 'Fallecido no encontrado.' })
  findByCedulaSolicitante(@Param('cedula') cedula: string) {
    return this.requisitosInhumacionService.findByCedulaSolicitante(cedula);
  }

  @Get('/nicho-huecos/:id_cementerio/:sector/:fila')
  @ApiOperation({ summary: 'Buscar nicho por cementerio, sector y fila y mostrar huecos disponibles' })
  @ApiParam({ name: 'id_cementerio', description: 'ID del cementerio', example: 'uuid-cementerio' })
  @ApiParam({ name: 'sector', description: 'Sector del nicho', example: 'A' })
  @ApiParam({ name: 'fila', description: 'Fila del nicho', example: '1' })
  @ApiResponse({ status: 200, description: 'Nicho y huecos disponibles encontrados.' })
  @ApiResponse({ status: 404, description: 'Nicho no encontrado.' })
  async findByCementerioSectorFila(
    @Param('id_cementerio') id_cementerio: string,
    @Param('sector') sector: string,
    @Param('fila') fila: string,
  ) {
    return this.requisitosInhumacionService.findByCementerioSectorFila(id_cementerio, sector, fila);
  }

  @Get('fallecidos/:busqueda')
  @ApiOperation({ summary: 'Buscar fallecidos en requisitos de inhumación por cédula, nombres o apellidos (búsqueda parcial)' })
  @ApiParam({ 
    name: 'busqueda', 
    example: 'Pablo',
    description: 'Término de búsqueda para cédula, nombres o apellidos del fallecido'
  })
  @ApiResponse({ status: 200, description: 'Lista de fallecidos encontrados en requisitos de inhumación' })
  findFallecidos(@Param('busqueda') busqueda: string) {
    return this.requisitosInhumacionService.findByBusquedaFallecido(busqueda);
  }
}
