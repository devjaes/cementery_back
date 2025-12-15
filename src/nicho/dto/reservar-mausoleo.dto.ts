import { IsNotEmpty, IsString, IsUUID, IsNumber, IsOptional, Min } from 'class-validator';

export class ReservarMausoleoDto {
  @IsUUID()
  @IsNotEmpty()
  idBloque: string; // ID del bloque tipo Mausoleo

  @IsUUID()
  @IsNotEmpty()
  idPersona: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto: number;

  @IsString()
  @IsNotEmpty()
  generadoPor: string;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsString()
  @IsOptional()
  direccionComprador?: string;
}
