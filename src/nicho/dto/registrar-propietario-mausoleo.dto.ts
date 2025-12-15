import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

export class RegistrarPropietarioMausoleoDto {
  @IsUUID()
  @IsNotEmpty()
  idBloque: string; // ID del bloque tipo Mausoleo

  @IsUUID()
  @IsNotEmpty()
  idPersona: string;

  @IsString()
  @IsNotEmpty()
  tipoDocumento: string;

  @IsString()
  @IsNotEmpty()
  numeroDocumento: string;

  @IsString()
  @IsOptional()
  razon?: string;
}
