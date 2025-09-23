import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Cementerio } from 'src/cementerio/entities/cementerio.entity';
import { Persona } from 'src/personas/entities/persona.entity';
import { HuecosNicho } from 'src/huecos-nichos/entities/huecos-nicho.entity';
import { DeepPartial } from 'typeorm';

export enum MetodoSolicitud {
  ESCRITA = 'Escrita',
}

export class CreateRequisitosInhumacionDto {
  // A) Datos institucionales
  @ApiProperty({
    description: 'Cementerio donde se realiza la inhumación',
    example: { id_cementerio: 'uuid-cementerio'},
  })
  @IsNotEmpty()
  id_cementerio: DeepPartial<Cementerio>;

  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre del pantonero a cargo' })
  @IsString()
  pantoneroACargo: string;

  // B) Método de solicitud
  @ApiPropertyOptional({ enum: MetodoSolicitud, default: MetodoSolicitud.ESCRITA })
  @IsEnum(MetodoSolicitud)
  @IsOptional()
  metodoSolicitud?: MetodoSolicitud;

  // C) Datos del solicitante
  @ApiProperty({
    description: 'ID de la persona solicitante',
    example: { id_persona: 'uuid-solicitante' },
  })
  @IsNotEmpty()
  id_solicitante: DeepPartial<Persona>;

  @ApiPropertyOptional({ example: 'Observaciones sobre el solicitante' })
  @IsString()
  @IsOptional()
  observacionSolicitante?: string;

  // D) Checklist de requisitos
  @ApiProperty({ example: true })
  @IsBoolean()
  copiaCertificadoDefuncion: boolean;

  @ApiPropertyOptional({ example: 'Observación sobre el certificado de defunción' })
  @IsString()
  @IsOptional()
  observacionCertificadoDefuncion?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  informeEstadisticoINEC: boolean;

  @ApiPropertyOptional({ example: 'Observación sobre el informe estadístico INEC' })
  @IsString()
  @IsOptional()
  observacionInformeEstadisticoINEC?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  copiaCedula: boolean;

  @ApiPropertyOptional({ example: 'Observación sobre la copia de cédula' })
  @IsString()
  @IsOptional()
  observacionCopiaCedula?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  pagoTasaInhumacion: boolean;

  @ApiPropertyOptional({ example: 'Observación sobre el pago de tasa de inhumación' })
  @IsString()
  @IsOptional()
  observacionPagoTasaInhumacion?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  copiaTituloPropiedadNicho: boolean;

  @ApiPropertyOptional({ example: 'Observación sobre el título de propiedad del nicho' })
  @IsString()
  @IsOptional()
  observacionCopiaTituloPropiedadNicho?: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsOptional()
  autorizacionDeMovilizacionDelCadaver?: boolean;

  @ApiPropertyOptional({ example: 'Observación sobre la autorización de movilización del cadáver' })
  @IsString()
  @IsOptional()
  observacionAutorizacionMovilizacion?: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsOptional()
  OficioDeSolicitud?: boolean;

  @ApiPropertyOptional({ example: 'Observación sobre el oficio de solicitud' })
  @IsString()
  @IsOptional()
  observacionOficioSolicitud?: string;

  // E) Datos del nicho/fosa/sillio
  @ApiProperty({
    description: 'ID del hueco o nicho',
    example: { id_detalle_hueco: 'uuid-hueco-nicho' },
  })
  @IsNotEmpty()
  id_hueco_nicho: DeepPartial<HuecosNicho>;

  // F) Datos del fallecido
  @ApiProperty({
    description: 'ID de la persona fallecida',
    example: { id_persona: 'uuid-fallecido'},
  })
  @IsNotEmpty()
  id_fallecido: DeepPartial<Persona>;

  @ApiProperty({ example: '2024-06-01', description: 'Fecha de la inhumación' })
  @IsDateString()
  fechaInhumacion: Date;

  @ApiProperty({ example: '14:30', description: 'Hora de la inhumación (formato 24h)' })
  @IsString()
  horaInhumacion: string;

  @ApiProperty({ example: 'Nombre del administrador del nicho', description: 'Nombre del administrador del nicho' })
  @IsString()
  nombreAdministradorNicho: string;
}
