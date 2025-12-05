import { Injectable } from '@nestjs/common';
import * as PdfPrinter from 'pdfmake';
import * as fs from 'fs';
import * as path from 'path';
import { Mejora } from './entities/mejora.entity';
import { MetodoSolicitudMejora } from './enum/metodo-solicitud.enum';

@Injectable()
export class MejorasPdfService {
  private readonly printer: PdfPrinter;
  private readonly logo?: string;

  constructor() {
    const fonts = this.loadFonts();
    this.printer = new PdfPrinter(fonts);
    this.logo = this.loadLogo();
  }

  async build(mejora: Mejora): Promise<Buffer> {
    const definition = this.buildDefinition(mejora);
    return new Promise((resolve, reject) => {
      const pdf = this.printer.createPdfKitDocument(definition);
      const chunks: Buffer[] = [];

      pdf.on('data', (chunk) => chunks.push(chunk));
      pdf.on('end', () => resolve(Buffer.concat(chunks)));
      pdf.on('error', (err) => reject(err));
      pdf.end();
    });
  }

  private buildDefinition(mejora: Mejora) {
    const solicitante = mejora.solicitante;
    const nicho = mejora.nicho;
    const cementerio = nicho?.id_cementerio;
    const fallecido = mejora.fallecido;

    const metodoEscrito =
      mejora.metodoSolicitud === MetodoSolicitudMejora.ESCRITO;

    const metodoVerbal =
      mejora.metodoSolicitud === MetodoSolicitudMejora.VERBAL;

    return {
      defaultStyle: { font: 'Roboto', fontSize: 9 },
      pageMargins: [40, 50, 40, 40],
      images: this.logo
        ? {
            logoGad: this.logo,
          }
        : undefined,
      content: [
        {
          columns: [
            this.logo
              ? { image: 'logoGad', width: 90, height: 40 }
              : { text: '' },
            {
              stack: [
                {
                  text: 'GADM SANTIAGO DE PILLARO',
                  style: 'headerTitle',
                },
                {
                  text: 'Dirección de Servicios Públicos',
                  style: 'headerSubtitle',
                },
              ],
              alignment: 'center',
            },
            {
              stack: [
                { text: 'FECHA:', bold: true },
                { text: this.formatDate(mejora.fechaCreacion), margin: [0, 2, 0, 0] },
              ],
              alignment: 'right',
            },
          ],
        },
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              [
                {
                  text: 'AUTORIZACIÓN DE ARREGLOS / CONSTRUCCIÓN / LÁPIDA',
                  style: 'sectionTitle',
                },
                {
                  stack: [
                    { text: 'Código de autorización', bold: true, alignment: 'center' },
                    { text: mejora.codigoAutorizacion ?? mejora.codigo, alignment: 'center' },
                  ],
                },
              ],
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 15, 0, 10],
        },
        {
          table: {
            widths: ['50%', '50%'],
            body: [
              [
                {
                  stack: [
                    { text: 'A) Datos institucionales', style: 'sectionLabel' },
                    { text: `Cementerio: ${this.upper(cementerio?.nombre)}` },
                    { text: `Entidad: ${this.upper(mejora.entidad)}` },
                    { text: `Dirección: ${this.upper(mejora.direccionEntidad)}` },
                  ],
                },
                {
                  stack: [
                    { text: 'B) Método de solicitud', style: 'sectionLabel' },
                    {
                      columns: [
                        { text: 'Escrita', width: '*' },
                        { text: metodoEscrito ? 'X' : '', alignment: 'center', width: 30 },
                      ],
                    },
                    {
                      columns: [
                        { text: 'Verbal (emergencia)', width: '*' },
                        { text: metodoVerbal ? 'X' : '', alignment: 'center', width: 30 },
                      ],
                    },
                    { text: `Panteonero a cargo: ${this.upper(mejora.panteoneroACargo)}` },
                  ],
                },
              ],
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            widths: ['50%', '50%'],
            body: [
              [
                {
                  stack: [
                    { text: 'C) Datos del solicitante', style: 'sectionLabel' },
                    { text: `Nombre: ${this.upper(`${solicitante?.nombres ?? ''} ${solicitante?.apellidos ?? ''}`)}` },
                    { text: `Cédula: ${solicitante?.cedula ?? ''}` },
                    { text: `Dirección: ${this.upper(mejora.solicitanteDireccion ?? solicitante?.direccion)}` },
                    { text: `Teléfono: ${solicitante?.telefono ?? mejora.solicitanteTelefono ?? ''}` },
                    { text: `Correo: ${solicitante?.correo ?? mejora.solicitanteCorreo ?? ''}` },
                  ],
                },
                {
                  stack: [
                    { text: 'D) Datos de la persona fallecida', style: 'sectionLabel' },
                    { text: `Nombre: ${this.upper(`${fallecido?.nombres ?? ''} ${fallecido?.apellidos ?? ''}`)}` },
                    { text: `Fecha de fallecimiento: ${this.formatDate(fallecido?.fecha_defuncion)}` },
                    { text: `Observación solicitante: ${this.upper(mejora.observacionSolicitante)}` },
                  ],
                },
              ],
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  text: 'E) Datos del nicho / fosa / sitio',
                  style: 'sectionLabel',
                },
              ],
              [
                {
                  columns: [
                    {
                      width: '33%',
                      stack: [
                        { text: `Propietario: ${this.upper(mejora.propietarioNombre)}` },
                        { text: `Fecha de adquisición: ${this.formatDate(mejora.propietarioFechaAdquisicion)}` },
                        { text: `Tenencia: ${this.upper(mejora.propietarioTipoTenencia)}` },
                      ],
                    },
                    {
                      width: '33%',
                      stack: [
                        { text: `Número de nichos: ${nicho?.num_huecos ?? ''}` },
                        { text: `Lugar del nicho: ${this.upper(cementerio?.nombre)}` },
                        { text: `Administrador: ${this.upper(mejora.administradorNicho)}` },
                      ],
                    },
                    {
                      width: '34%',
                      stack: [
                        { text: `Fila / Columna: ${this.upper(`${nicho?.fila ?? ''} / ${nicho?.columna ?? ''}`)}` },
                        { text: `Código sitio: ${nicho?.id_nicho ?? ''}` },
                        { text: `Observación: ${this.upper(mejora.observacionServicio)}` },
                      ],
                    },
                  ],
                },
              ],
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            widths: ['50%', '50%'],
            body: [
              [
                {
                  stack: [
                    { text: 'F) Datos para realizar la acción', style: 'sectionLabel' },
                    { text: `Tipo de servicio: ${this.upper(mejora.tipoServicio)}` },
                    { text: `Fecha de inicio: ${this.formatLongDate(mejora.fechaInicio)}` },
                    { text: `Fecha de fin: ${this.formatLongDate(mejora.fechaFin)}` },
                  ],
                },
                {
                  stack: [
                    { text: '' },
                    { text: `Horario de trabajo: ${this.upper(mejora.horarioTrabajo)}` },
                    { text: `Condición: ${this.upper(mejora.condicion)}` },
                  ],
                },
              ],
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  text: mejora.autorizacionTexto
                    ? `SE AUTORIZA ${this.upper(mejora.autorizacionTexto)}`
                    : `SE AUTORIZA LA REALIZACIÓN DE ${this.upper(mejora.tipoServicio)}`,
                  alignment: 'center',
                  bold: true,
                  fillColor: '#f4e04d',
                  margin: [0, 4, 0, 4],
                },
              ],
            ],
          },
          margin: [0, 0, 0, 10],
        },
        {
          text:
            mejora.condicion ??
            'En caso de no dar cumplimiento a esta disposición se procederá a su derrocamiento para constancia firma la parte interesada.',
          margin: [0, 0, 0, 6],
        },
        {
          text:
            mejora.normativaAplicable ??
            'El solicitante deberá dar cumplimiento a la ordenanza municipal que regula la administración y funcionamiento de los cementerios del canton Santiago de Pillaro.',
          margin: [0, 0, 0, 6],
        },
        {
          text:
            mejora.obligacionesPostObra ??
            'Terminadas las obras, los responsables deberán retirar materiales y dejar el área en condiciones adecuadas.',
          margin: [0, 0, 0, 6],
        },
        {
          text:
            mejora.escombreraMunicipal ??
            'Los residuos deberán depositarse en la escombrera municipal designada por la Dirección de Servicios Públicos.',
          margin: [0, 0, 0, 14],
        },
        {
          table: {
            widths: ['33%', '34%', '33%'],
            body: [
              [
                {
                  text: this.upper(mejora.aprobadoPor?.nombre
                    ? `${mejora.aprobadoPor.nombre} ${mejora.aprobadoPor.apellido}`
                    : 'Aprobado por'),
                  alignment: 'center',
                  margin: [0, 20, 0, 0],
                },
                { text: '', border: [false, false, false, false] },
                {
                  text: this.upper(`${solicitante?.nombres ?? ''} ${solicitante?.apellidos ?? ''}`),
                  alignment: 'center',
                  margin: [0, 20, 0, 0],
                },
              ],
              [
                { text: 'Aprobado por', alignment: 'center', bold: true },
                { text: '', border: [false, false, false, false] },
                { text: 'Solicitante responsable', alignment: 'center', bold: true },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
          },
        },
      ],
      styles: {
        headerTitle: { fontSize: 12, bold: true },
        headerSubtitle: { fontSize: 10, margin: [0, 2, 0, 0] },
        sectionTitle: { fontSize: 11, bold: true, margin: [0, 0, 0, 0] },
        sectionLabel: { fontSize: 10, bold: true, margin: [0, 0, 0, 4] },
      },
    };
  }

  private loadFonts() {
    const fontsRoot = path.join(process.cwd(), 'assets', 'fonts');
    const normal = path.join(fontsRoot, 'Roboto-Regular.ttf');
    const bold = path.join(fontsRoot, 'Roboto-Bold.ttf');
    const italics = path.join(fontsRoot, 'Roboto-Italic.ttf');

    const exists = (file: string) => (fs.existsSync(file) ? file : undefined);

    return {
      Roboto: {
        normal: exists(normal),
        bold: exists(bold),
        italics: exists(italics),
        bolditalics: exists(bold),
      },
    } as const;
  }

  private loadLogo(): string | undefined {
    const logoPath = path.join(process.cwd(), 'assets', 'img', 'logoPillaro.jpeg');
    if (!fs.existsSync(logoPath)) {
      return undefined;
    }
    const buffer = fs.readFileSync(logoPath);
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  }

  private formatDate(date?: Date | string | null): string {
    const parsed = this.parseDateOnlyAware(date);
    if (!parsed) return '';
    // Siempre devolver YYYY-MM-DD evitando corrimientos de zona horaria
    const year = parsed.getUTCFullYear();
    const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
    const day = String(parsed.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatLongDate(date?: Date | string | null): string {
    const parsed = this.parseDateOnlyAware(date);
    if (!parsed) return '';

    // Forzar fecha en zona America/Guayaquil sin corrimiento
    const formatter = new Intl.DateTimeFormat('es-EC', {
      timeZone: 'America/Guayaquil',
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    // Si viene como fecha (sin hora), construimos string YYYY-MM-DDT00:00:00-05:00 para evitar desfase
    if (typeof date === 'string') {
      const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(date.trim());
      if (match) {
        const [, y, m, d] = match;
        const asLocal = new Date(`${y}-${m}-${d}T00:00:00-05:00`);
        return formatter.format(asLocal).toUpperCase();
      }
    }

    return formatter.format(parsed).toUpperCase();
  }

  // Parsea fechas YYYY-MM-DD sin corrimiento de tz; si viene con hora, usa Date estándar
  private parseDateOnlyAware(date?: Date | string | null): Date | null {
    if (!date) return null;

    if (typeof date === 'string') {
      const trimmed = date.trim();
      const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(trimmed);
      if (match) {
        const [, y, m, d] = match;
        // Crear fecha en UTC para ese día concreto y luego formatear con zona de Ecuador
        return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
      }
      const parsed = new Date(trimmed);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private upper(value?: string | null): string {
    return value ? value.toString().toUpperCase() : '';
  }
}
