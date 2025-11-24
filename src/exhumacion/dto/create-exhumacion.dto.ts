import { IsString, IsDate, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExhumacionDto {
  @IsDate()
  @Type(() => Date)
  fecha_exhumacion: Date;

  @IsString()
  hora_exhumacion: string;

  @IsString()
  duenio_nicho: string;

  @IsString()
  ubicacion: string;

  @IsString()
  causa: string;

  @IsString()
  @IsOptional()
  observacion?: string;

  @IsOptional()
  archivos: Express.Multer.File[]; // ← recibe archivos reales

  @IsString()
  nicho_original_id: string;

  @IsString()
  inhumacion_id: string;
}
