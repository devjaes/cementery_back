// src/requisitos-inhumacion/pdf-generator.service.ts
import { Injectable } from '@nestjs/common';
import * as PdfPrinter from 'pdfmake';
import * as fs from 'fs';
import * as path from 'path';
import { text } from 'stream/consumers';

@Injectable()
export class PDFGeneratorService {

  async generarPDF(requisitos: any): Promise<string> {
    try {
      console.log(JSON.stringify(requisitos, null, 2));
      let fonts: any;

      try {
        const normal = path.join(process.cwd(), 'assets/fonts/Roboto-Regular.ttf');
        const bold = path.join(process.cwd(), 'assets/fonts/Roboto-Bold.ttf');
        const italics = path.join(process.cwd(), 'assets/fonts/Roboto-Italic.ttf');

        fonts = {
          Roboto: {
            normal: fs.existsSync(normal) ? normal : undefined,
            bold: fs.existsSync(bold) ? bold : undefined,
            italics: fs.existsSync(italics) ? italics : undefined,
          }
        };
      } catch (error) {
        console.warn('No se pudieron cargar las fuentes. Se usará la fuente por defecto.');
        fonts = {};
      }

      let imageBase64 = '';
      const imagePath = path.join(process.cwd(), 'assets/img/logoPillaro.jpeg');

      if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);
        imageBase64 = imageBuffer.toString('base64');
      } else {
        console.warn(`Imagen no encontrada en: ${imagePath}. El PDF se generará sin el logo.`);
      }

      const images = {
        ...(imageBase64 && { logoPillaro: `data:image/jpeg;base64,${imageBase64}` })
      };


      const printer = new PdfPrinter(fonts);

      const docDefinition = {
        images,
        pageBreak: 'avoid',
        content: [
          {
            table: {
              widths: ['*'],
              body: [
                [
                  {
                    stack: [
                      {
                        columns: [
                          {
                            image: images['logoPillaro'] ? 'logoPillaro' : undefined,
                            width: 100,
                            height: 40,
                          },
                          {
                            width: '*',
                            stack: [
                              { text: 'GADM SANTIAGO DE PÍLLARO', style: 'headerCenter', margin: [0, 10, 0, 15] },
                              { text: 'DIRECCIÓN DE SERVICIOS PÚBLICOS', style: 'subheaderCenter', bold: true },
                            ],
                            alignment: 'center',
                          },
                          { width: 60, text: '' }
                        ],
                        margin: [0, 0, 0, 15],

                      },

                      {
                        columns: [
                          {
                            width: 'auto',
                            text: 'FECHA:',
                            alignment: 'left',
                            bold: true,
                            margin: [5, 0, 0, 0] // [left, top, right, bottom]
                          },
                          {
                            width: 'auto',
                            text: this.formatearFechaLarga(new Date()),
                            alignment: 'left',
                          },

                          {
                            width: 'auto',
                            text: '   Legalización de trámites',
                            alignment: 'left',
                          }
                        ],
                        columnGap: 10,
                        margin: [0, 0, 0, 10]
                      },
                      {
                        table: {
                          widths: ['*', '*', '*'],
                          body: [
                            [
                              { text: 'AUTORIZACIÓN DE INHUMACIÓN', style: 'tableLabel', alignment: 'center', bold: true, valign: 'middle' },
                              { text: 'Código de Inhumación', alignment: 'center', style: 'tableLabel', bold: true, valign: 'middle' },
                              { text: requisitos?.inhumacion?.codigo_inhumacion || '', alignment: 'center', style: 'tableLabel', bold: true, valign: 'middle' }
                            ],
                            [
                              {
                                colSpan: 3,
                                fillColor: 'black',
                                text: '',
                                margin: [0, 2, 0, 2], // antes era [0, 10, 0, 10]
                              }, {}, {}
                            ],

                          ]
                        },
                        layout: {
                          hLineWidth: () => 1,
                          hLineColor: () => 'black',
                          vLineWidth: () => 1,
                          vLineColor: () => 'black',
                          paddingLeft: (i, node) => {
                            return i === 0 ? 0 : 4;
                          },
                          paddingRight: (i, node) => {
                            return i === node.table.widths.length - 1 ? 0 : 4;
                          },
                          paddingTop: () => 4,
                          paddingBottom: () => 4,
                        },
                        margin: [0, 0]
                      },

                      {
                        table: {
                          widths: ['0.5%', '24.5%', '25%', '25%', '25%'],
                          body: [
                            [
                              { border: [false, true, false, true], text: ' ' },
                              { text: 'A) Datos Institucionales:', colSpan: 2, bold: true, alignment: 'center', valign: 'middle', border: [false, true, true, true] },
                              {},
                              { text: 'B) Método de Solicitud', colSpan: 2, bold: true, alignment: 'center', valign: 'middle' },
                              { border: [false, false, false, false], text: ' ' }
                            ],

                            [
                              { border: [false, false, false, true], text: ' ' },
                              { text: 'Cementerio:', bold: true, valign: 'middle', border: [false, true, true, true] },
                              requisitos?.cementerio?.nombre?.toUpperCase() || '',
                              { text: 'Escrita', bold: true, valign: 'middle' },
                              { text: requisitos?.metodoSolicitud === 'Escrita' ? 'X' : '', alignment: 'center' }
                            ],

                            [
                              { border: [false, false, false, true], text: ' ' },
                              { text: 'Panteonero a cargo:', bold: true, valign: 'middle', border: [false, true, true, true] },
                              requisitos?.pantoneroACargo?.toUpperCase() || '',
                              { text: 'Verbal (solo en caso de emergencia)', bold: true, valign: 'middle' },
                              { text: requisitos?.metodoSolicitud === 'Verbal' ? 'X' : '', alignment: 'center' }
                            ],
                            [
                              {
                                colSpan: 5,
                                fillColor: 'black',
                                text: '',
                                margin: [0, 2, 0, 2], // antes era [0, 10, 0, 10]
                              }, {}, {}, {}
                            ],

                          ]
                        },
                        layout: {
                          hLineWidth: () => 0.5,
                          hLineColor: () => 'black',
                          vLineWidth: () => 0.5,
                          vLineColor: () => 'black',
                          paddingLeft: (i, node) => {
                            return i === 0 ? 0 : 4;
                          },
                          paddingRight: (i, node) => {
                            return i === node.table.widths.length - 1 ? 0 : 4;
                          },
                          paddingTop: () => 4,
                          paddingBottom: () => 4,
                        },
                        margin: [0, 0]
                      },
                      {
                        table: {
                          widths: ['0.5%', '20.5%', '15%', '25%', '10%', '10%', '19%'],
                          body: [
                            [
                              { border: [false, true, false, true], text: '' },
                              { text: 'C) Datos del solicitante:', bold: true, alignment: 'center', valign: 'middle', border: [false, true, true, true] },
                              { text: 'D) CHECK LIST DE REQUISITOS', bold: true, alignment: 'center', colSpan: 2, valign: 'middle' },
                              { text: '' },
                              { text: 'Cumple', bold: true, alignment: 'center', valign: 'middle' },
                              { text: 'No cumple', bold: true, alignment: 'center', valign: 'middle' },
                              { text: 'Observación', bold: true, alignment: 'left', valign: 'middle' },
                            ],

                            [
                              { border: [false, true, false, true], text: '' },
                              { text: '  Nombre/Apellido', bold: true, valign: 'middle', border: [false, true, true, true] },
                              { text: `${requisitos?.solicitante?.nombres?.toUpperCase() || ''} ${requisitos?.solicitante?.apellidos?.toUpperCase() || ''}`, valign: 'middle', border: [false, true, true, true] },
                              { text: '  Copia del certificado de defunción JRC', alignment: 'left', valign: 'middle' },
                              { text: requisitos?.copiaCertificadoDefuncion ? 'X' : '', alignment: 'center', valign: 'middle' },
                              { text: !requisitos?.copiaCertificadoDefuncion ? 'X' : '', alignment: 'center', valign: 'middle' },
                              { text: requisitos?.observacionCertificadoDefuncion || '', alignment: 'left', valign: 'middle' }
                            ],

                            [
                              { border: [false, true, false, true], text: '' },
                              { text: '  N° Cédula de identidad', bold: true, valign: 'middle', border: [false, true, true, true] },
                              { text: requisitos?.solicitante?.cedula || '', valign: 'middle' },
                              { text: '  Informe estadístico INEC', alignment: 'left', valign: 'middle' },
                              { text: requisitos?.informeEstadisticoINEC ? 'X' : '', alignment: 'center', valign: 'middle' },
                              { text: !requisitos?.informeEstadisticoINEC ? 'X' : '', alignment: 'center', valign: 'middle' },
                              { text: requisitos?.observacionInformeEstadisticoINEC || '', alignment: 'left', valign: 'middle' }
                            ],

                            [
                              { border: [false, false, false, false], text: '' },
                              { text: 'Dirección', bold: true, rowSpan: 2, margin: [0, 5, 0, 5], valign: 'middle', border: [false, false, false, false] },
                              { text: requisitos?.solicitante?.direccion?.toUpperCase() || '', rowSpan: 2, valign: 'middle' },
                              { text: 'Copia de C.I. del solicitante', alignment: 'left', valign: 'middle' },
                              { text: requisitos?.copiaCedula ? 'X' : '', alignment: 'center', valign: 'middle' },
                              { text: !requisitos?.copiaCedula ? 'X' : '', alignment: 'center', valign: 'middle' },
                              { text: requisitos?.observacionCopiaCedula || '', alignment: 'left', valign: 'middle' }
                            ],

                            [
                              { border: [false, false, false, false], text: '' },
                              { border: [false, false, false, false], text: '' },
                              { border: [false, false, false, false], text: '' },
                              { text: 'Pago de tasa por inhumación', alignment: 'left' },
                              { text: requisitos?.pagoTasaInhumacion ? 'X' : '', alignment: 'center', valign: 'middle' },
                              { text: !requisitos?.pagoTasaInhumacion ? 'X' : '', alignment: 'center', valign: 'middle' },
                              { text: requisitos?.observacionPagoTasaInhumacion || '', alignment: 'left', valign: 'middle' }
                            ],

                            [
                              { border: [false, true, false, true], text: '' },
                              { text: 'Num Celular', bold: true, border: [false, true, true, true] },
                              { text: requisitos?.solicitante?.telefono || '' },
                              { text: 'Copia del T. de propiedad del nicho/fosa/sitio', alignment: 'left', valign: 'middle' },
                              { text: requisitos?.copiaTituloPropiedadNicho ? 'X' : '', alignment: 'center', valign: 'middle' },
                              { text: !requisitos?.copiaTituloPropiedadNicho ? 'X' : '', alignment: 'center', valign: 'middle' },
                              { text: requisitos?.observacionCopiaTituloPropiedadNicho || '', alignment: 'left', valign: 'middle' }
                            ],

                            [
                              { border: [false, false, false, false], text: '' },
                              { text: 'Observación', bold: true, rowSpan: 2, margin: [0, 5, 0, 5], valign: 'middle', border: [false, false, false, false] },
                              { text: requisitos?.observacionSolicitante || '', rowSpan: 2, valign: 'middle' },
                              { text: 'Autorización de Movilización del Cadáver', alignment: 'left', valign: 'middle' },
                              { text: requisitos?.autorizacionDeMovilizacionDelCadaver ? 'X' : '', alignment: 'center', valign: 'middle' },
                              { text: !requisitos?.autorizacionDeMovilizacionDelCadaver ? 'X' : '', alignment: 'center', valign: 'middle' },
                              { text: requisitos?.observacionAutorizacionMovilizacion || '', alignment: 'left', valign: 'middle' }
                            ],

                            [
                              { border: [false, false, false, false], text: '' },
                              { border: [false, false, false, false], text: '' },
                              { border: [false, false, false, false], text: '' },
                              { text: 'Oficio de Solicitud', alignment: 'left' },
                              { text: requisitos?.OficioDeSolicitud ? 'X' : '', alignment: 'center', valign: 'middle' },
                              { text: !requisitos?.OficioDeSolicitud ? 'X' : '', alignment: 'center', valign: 'middle' },
                              { text: requisitos?.observacionOficioSolicitud || '', alignment: 'left', valign: 'middle' }
                            ],

                            [
                              {
                                colSpan: 7,
                                fillColor: 'black',
                                text: '',
                                margin: [0, 2, 0, 2] // antes era [0, 10, 0, 10]
                              }, {}, {}, {}, {}, {}
                            ],
                          ]
                        },

                        layout: {
                          hLineWidth: () => 0.5,
                          hLineColor: () => 'black',
                          vLineWidth: () => 0.5,
                          vLineColor: () => 'black',
                          paddingLeft: (i, node) => {
                            return i === 0 ? 0 : 4;
                          },
                          paddingRight: (i, node) => {
                            return i === node.table.widths.length - 1 ? 0 : 4;
                          },
                          paddingTop: () => 4,
                          paddingBottom: () => 4,
                        },

                        margin: [0, 0, 0, 0]
                      },
                      {
                        table: {
                          dontBreakRows: false,
                          widths: ['0.5%', '15.5%', '10%', '15%', '10%', '30%', '19%'],
                          body: [
                            [
                              { border: [false, true, false, true], text: '' },
                              { text: 'E) Datos del nicho/fosa/sitio', colSpan: 6, bold: true, alignment: 'center', margin: [0, 5], border: [false, true, true, true] },
                              { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }
                            ],

                            [
                              { border: [false, true, false, true], text: '' },
                              { text: 'Nombre del Propietario:', bold: true, colSpan: 2, border: [false, true, true, true] },
                              {},
                              { text: `${requisitos?.propietarioNicho?.find((p: any) => p.activo == true)?.id_persona?.nombres || ''} ${requisitos?.propietarioNicho?.find((p: any) => p.activo == true)?.id_persona?.apellidos || ''}`.toUpperCase().trim(), colSpan: 2 },
                              {},
                              { text: 'Número de nicho', bold: true },
                              { text: requisitos?.nicho?.numero || '' },
                            ],


                            [
                              { border: [false, true, false, true], text: '' },
                              { text: 'Fecha de adquisición', bold: true, colSpan: 2, border: [false, true, true, true] },
                              {},
                              { text: this.formatearFechaLarga(requisitos?.propietarioNicho?.[0]?.fecha_adquisicion || ''), colSpan: 2 },
                              {},
                              { text: 'Lugar del nicho', bold: true },
                              { text: requisitos?.nicho?.id_cementerio?.nombre?.toUpperCase() || '', alignment: 'left' },
                            ],

                            [
                              { border: [false, true, false, true], text: '' },
                              { text: 'Nombre del administrador', bold: true, colSpan: 2, border: [false, true, true, true] },
                              {},
                              { text: (requisitos?.nombreAdministradorNicho || '').toUpperCase(), colSpan: 2 },
                              {},
                              { text: 'Lugar del sitio / código', bold: true },
                              { text: `${requisitos?.huecoNicho?.id_nicho?.sector || ''} ${requisitos?.huecoNicho?.id_nicho?.fila || ''} / ${requisitos?.huecoNicho?.id_nicho?.id_nicho || ''}`.trim() },
                            ],

                            [
                              { border: [false, true, false, true], text: '' },
                              { text: 'ARRENDADO', bold: true, alignment: 'right', border: [false, true, true, true] },
                              { text: requisitos?.propietarioNicho?.[0]?.tipo === 'Arrendado' ? 'X' : '', alignment: 'center' },
                              { text: 'PROPIO', bold: true, alignment: 'right' },
                              { text: requisitos?.propietarioNicho?.[0]?.tipo === 'Propio' ? 'X' : '', alignment: 'center' },
                              { text: 'Firma de aceptación de sepultura', bold: true },
                              {}
                            ],
                            [
                              {
                                colSpan: 7,
                                fillColor: 'black',
                                text: '',
                                margin: [0, 2, 0, 2], // antes era [0, 10, 0, 10]
                              }, {}, {}, {}, {}
                            ],

                          ]
                        },
                        layout: {
                          hLineWidth: () => 0.5,
                          hLineColor: () => 'black',
                          vLineWidth: () => 0.5,
                          vLineColor: () => 'black',
                          paddingLeft: (i, node) => {
                            return i === 0 ? 0 : 4;
                          },
                          paddingRight: (i, node) => {
                            return i === node.table.widths.length - 1 ? 0 : 4;
                          },
                          paddingTop: () => 4,
                          paddingBottom: () => 4,
                        },
                        margin: [0, 0]
                      },

                      {
                        table: {
                          widths: ['0.5%', '20.5%', '30%', '25%', '24%'],
                          body: [
                            [
                              { border: [false, true, false, true], text: '' },
                              { text: 'F) DATOS DEL FALLECIDO', colSpan: 4, bold: true, alignment: 'center', margin: [0, 0], border: [false, true, true, true] },
                              {}, {}, {}
                            ],

                            [
                              { border: [false, true, false, true], text: '' },
                              { text: 'Nombre/Apellido', bold: true, alignment: 'left', valign: 'middle', border: [false, true, true, true] },
                              { text: `${requisitos?.fallecido?.nombres?.toUpperCase() || ''} ${requisitos?.fallecido?.apellidos?.toUpperCase() || ''}`, alignment: 'left', valign: 'middle' },
                              { text: 'N° de Cédula de identidad', bold: true, alignment: 'left', valign: 'middle' },
                              { text: requisitos?.fallecido?.cedula || '', alignment: 'left', valign: 'middle' }
                            ],

                            [
                              { border: [false, true, false, true], text: '' },
                              { text: 'Causa de muerte', bold: true, alignment: 'left', valign: 'middle', border: [false, true, true, true] },
                              { text: requisitos?.fallecido?.causa_defuncion || '', alignment: 'left', valign: 'middle' },
                              { text: 'Nacionalidad', bold: true, alignment: 'left', valign: 'middle' },
                              { text: (requisitos?.fallecido?.nacionalidad || '').toUpperCase(), alignment: 'left', valign: 'middle' }
                            ],

                            [
                              { border: [false, true, false, true], text: '' },
                              { text: 'Fecha de nacimiento', bold: true, alignment: 'left', valign: 'middle', border: [false, true, true, true] },
                              { text: this.formatearFechaLarga(requisitos?.fallecido?.fecha_nacimiento || ''), alignment: 'left', valign: 'middle' },
                              { text: 'Fecha de Inhumación', bold: true, alignment: 'left', valign: 'middle' },
                              { text: this.formatearFechaLarga(requisitos?.fechaInhumacion || ''), alignment: 'left', valign: 'middle' }
                            ],

                            [
                              { border: [false, true, false, true], text: '' },
                              { text: 'Fecha de fallecimiento', bold: true, alignment: 'left', valign: 'middle', border: [false, true, true, true] },
                              { text: this.formatearFechaLarga(requisitos?.fallecido?.fecha_defuncion || ''), alignment: 'left', valign: 'middle' },
                              { text: 'Hora de Inhumación', bold: true, alignment: 'left', valign: 'middle' },
                              { text: this.formatearHora(requisitos?.horaInhumacion || ''), alignment: 'left', valign: 'middle' }
                            ],
                            [
                              {
                                colSpan: 5,
                                fillColor: 'black',
                                text: '',
                                margin: [0, 2, 0, 2], // antes era [0, 10, 0, 10]
                                height: 4
                              }, {}, {}, {}, {}
                            ],

                          ]
                        },
                        layout: {
                          hLineWidth: () => 0.5,
                          hLineColor: () => 'black',
                          vLineWidth: () => 0.5,
                          vLineColor: () => 'black',
                          paddingLeft: (i, node) => {
                            return i === 0 ? 0 : 4;
                          },
                          paddingRight: (i, node) => {
                            return i === node.table.widths.length - 1 ? 0 : 4;
                          },
                          paddingTop: () => 4,
                          paddingBottom: () => 4,
                        },
                        margin: [0, 0]
                      },
                      {
                        table: {
                          widths: ['*'],
                          body: [
                            [
                              {
                                text: [
                                  'A petición del solicitante y habiendo cumplido con los requisitos de Ley, ',
                                  { text: 'SE AUTORIZA', bold: true },
                                  ' la inhumación en el cementerio municipal.'
                                ],
                                margin: [0, 2],
                                valign: 'middle',
                                alignment: 'center',
                                fontSize: 4
                              }
                            ],
                            [
                              {
                                text: 'Se debe indicar que se ha socializado con los deudos que para realizar exhumaciones está prohibido para todos los que fallecieron a partir 2020.',
                                margin: [0, 4],
                                valign: 'middle',
                                alignment: 'center',
                                fontSize: 4
                              }
                            ],
                            [
                              {
                                text: [
                                  'El solicitante de ser el caso deberá dar cumplimiento a la ',
                                  {
                                    text: 'ORDENANZA QUE REGULA LA ADMINISTRACIÓN Y FUNCIONAMIENTO DE LOS CEMENTERIOS MUNICIPALES DEL CANTÓN SANTIAGO DE PILLARO CAPÍTULO IV DE LAS ÁREAS DE INHUMACIÓN EN NICHOS Y FOSAS ART.17 ',
                                    bold: true
                                  },
                                  'Terminadas las obras, los constructores o en su defecto los titulares del derecho funerario correspondiente, estarán obligados a retirar las tierras, piedras, escombros y en general cualquier residuo de los materiales empleados, para que sean depositados en la escombrera municipal ubicada en: EL SECTOR DE YAMBO HUAPANTE GRANDE.;\n así como obligados a reparar cualquier desperfecto que con vehículos o cualquier otro elemento hayan causado en las calles, instalaciones, construcciones. etc.'
                                ],
                                fontSize: 5,
                                alignment: 'center',
                                margin: [0, 4],
                                valign: 'middle',
                              }

                            ]
                          ]
                        },
                        layout: {
                          hLineWidth: function (i, node) {
                            return (i > 0) ? 1.5 : 0;
                          },
                          hLineColor: function (i, node) {
                            return 'black';
                          },
                          vLineWidth: () => 0,
                          vLineColor: () => 'black',
                          paddingLeft: (i, node) => {
                            return i === 0 ? 0 : 4;
                          },
                          paddingRight: (i, node) => {
                            return i === node.table.widths.length - 1 ? 0 : 4;
                          },
                          paddingTop: () => 4,
                          paddingBottom: () => 4
                        },
                        margin: [0, 4],
                      },

                      {
                        table: {
                          widths: ['4%', '25%', '4%', '34%', '4%', '25%', '4%'],
                          body: [
                            [
                              { text: ' ', border: [false, false, false, false] },
                              { text: '', border: [false, true, false, false], margin: [5, 6] },
                              { text: ' ', border: [] },
                              { text: 'Revisado y aprobado por', border: [false, true, false, false], alignment: 'center', margin: [5, 6], bold: true },
                              { text: ' ', border: [] },
                              { text: 'Solicitante Responsable', border: [false, true, false, false], alignment: 'center', margin: [5, 6], bold: true },
                              { text: ' ', border: [false, false, false, false] }
                            ],
                            [
                              { text: ' ', border: [false, false, false, false] },
                              { text: '', border: [false, false, false, false] },
                              { text: ' ', border: [] },
                              { text: 'Ing. Jenny Constante', alignment: 'center', margin: [0, 0, 0, 5], border: [false, false, false, false] },
                              { text: ' ', border: [] },
                              { text: `${requisitos?.fallecido?.nombres || ''} ${requisitos?.fallecido?.apellidos || ''}`, alignment: 'center', margin: [0, 0, 0, 5], border: [false, false, false, false] },
                              { text: ' ', border: [false, false, false, false] }
                            ],
                            [
                              { text: ' ', border: [false, false, false, false] },
                              { text: 'Directora de Servicios Públicos', colSpan: 5, alignment: 'center', border: [false, false, false, false], margin: [0, 0, 0, 0] },
                              { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] },
                              { text: ' ', border: [false, false, false, false] }
                            ]
                          ]
                        },
                        margin: [0, 16, 0, 0]
                      }
                    ],
                  }
                ]
              ]
            },
            layout: {
              hLineWidth: () => 1,
              vLineWidth: () => 1.5,
              hLineColor: () => 'black',
              vLineColor: () => 'black',
              paddingLeft: (i, node) => {
                return i === 0 ? 0 : 4;
              },
              paddingRight: (i, node) => {
                return i === node.table.widths.length - 1 ? 0 : 4;
              },
              paddingTop: () => 10,
              paddingBottom: () => 10
            },
            margin: [20, 20, 20, 20],
            fontSize: 5,
            padding: [6, 6, 6, 6],
          }
        ],
        styles: {
          headerCenter: { fontSize: 8, bold: true, alignment: 'center' },
          subheaderCenter: { fontSize: 8, alignment: 'center' },
          title: { fontSize: 8, bold: true, margin: [0, 10, 0, 10], alignment: 'center' },
          date: { fontSize: 8, italics: true },
          section: { fontSize: 8, bold: true, margin: [0, 10, 0, 5], decoration: 'underline' },
        },
      };

      const pdfDir = path.resolve(__dirname, '../../pdfs');

      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      if (!requisitos?.id_requsitoInhumacion) {
        return Promise.reject('No se puede generar el nombre del PDF: ID de requisito inválido');
      }

      const pdfPath = path.resolve(pdfDir, `inhumacion_${requisitos.id_requsitoInhumacion}.pdf`);

      return new Promise((resolve, reject) => {
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const writeStream = fs.createWriteStream(pdfPath);

        pdfDoc.pipe(writeStream);
        pdfDoc.end();

        writeStream.on('finish', () => {
          resolve(pdfPath);
        });

        writeStream.on('error', (err) => {
          reject(err);
        });
      });
    } catch (error) {
      console.error('Error generando PDF:', error);
      return Promise.reject('Ocurrió un error al generar el PDF');
    }
  }

  formatearFechaLarga(fecha: string | Date | undefined | null): string {
    if (!fecha || typeof fecha === 'string' && fecha.trim() === '') return '';

    const date = new Date(fecha);
    if (isNaN(date.getTime())) return '';

    return date.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).toUpperCase();
  }

  formatearHora(hora: string | undefined | null): string {
    if (!hora || typeof hora !== 'string') return '';

    const trimmed = hora.trim();

    const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      const [, hh, mm] = match;
      return `${hh.padStart(2, '0')}H${mm}`;
    }

    if (/^\d{1,2}H\d{2}$/.test(trimmed)) return trimmed;

    return '';
  }



}
