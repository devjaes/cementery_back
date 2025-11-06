import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

export class ConfirmarVentaNichoDto {
  @IsUUID()
  @IsNotEmpty()
  idPago: string;

  @IsString()
  @IsNotEmpty()
  validadoPor: string;

  @IsString()
  @IsOptional()
  archivoRecibo?: string;
}