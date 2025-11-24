import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetodoSolicitudMejora } from '../enum/metodo-solicitud.enum';

export class CreateMejoraDto {
  @ApiProperty({ description: 'Identificador del nicho', format: 'uuid' })
  @IsUUID()
  id_nicho: string;

  @ApiProperty({
    description: 'Identificador del solicitante',
    format: 'uuid',
  })
  @IsUUID()
  id_solicitante: string;

  @ApiPropertyOptional({
    description: 'Identificador del fallecido asociado',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  id_fallecido?: string;

  @ApiProperty({ enum: MetodoSolicitudMejora })
  @IsEnum(MetodoSolicitudMejora)
  metodoSolicitud: MetodoSolicitudMejora;

  @ApiPropertyOptional({ description: 'Entidad que emite la autorización' })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  entidad?: string;

  @ApiPropertyOptional({ description: 'Dirección de la entidad' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  direccionEntidad?: string;

  @ApiPropertyOptional({ description: 'Código interno de autorización' })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  codigoAutorizacion?: string;

  @ApiPropertyOptional({ description: 'Nombre del panteonero responsable' })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  panteoneroACargo?: string;

  @ApiPropertyOptional({ description: 'Dirección declarada por el solicitante' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  solicitanteDireccion?: string;

  @ApiPropertyOptional({ description: 'Correo electrónico del solicitante' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  solicitanteCorreo?: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto del solicitante' })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  solicitanteTelefono?: string;

  @ApiPropertyOptional({ description: 'Observaciones registradas por el solicitante' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  observacionSolicitante?: string;

  @ApiPropertyOptional({ description: 'Nombre del propietario registrado' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  propietarioNombre?: string;

  @ApiPropertyOptional({ description: 'Fecha de adquisición del nicho' })
  @IsDateString()
  @IsOptional()
  propietarioFechaAdquisicion?: string;

  @ApiPropertyOptional({ description: 'Tipo de tenencia (Propio/Arrendado)' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  propietarioTipoTenencia?: string;

  @ApiPropertyOptional({ description: 'Administrador del nicho' })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  administradorNicho?: string;

  @ApiProperty({ description: 'Tipo de servicio o mejora solicitada' })
  @IsString()
  @MaxLength(120)
  tipoServicio: string;

  @ApiPropertyOptional({ description: 'Descripción u observación del servicio' })
  @IsString()
  @IsOptional()
  observacionServicio?: string;

  @ApiProperty({ description: 'Fecha de inicio estimada' })
  @IsDateString()
  fechaInicio: string;

  @ApiProperty({ description: 'Fecha de finalización estimada' })
  @IsDateString()
  fechaFin: string;

  @ApiPropertyOptional({ description: 'Horario de trabajo autorizado' })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  horarioTrabajo?: string;

  @ApiPropertyOptional({ description: 'Condiciones de la autorización en caso de incumplimiento' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  condicion?: string;

  @ApiPropertyOptional({ description: 'Texto destacado de autorización' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  autorizacionTexto?: string;

  @ApiPropertyOptional({ description: 'Normativa aplicable indicada en el formulario' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  normativaAplicable?: string;

  @ApiPropertyOptional({ description: 'Obligaciones posteriores a la obra' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  obligacionesPostObra?: string;

  @ApiPropertyOptional({ description: 'Lugar de depósito de escombros' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  escombreraMunicipal?: string;
}
