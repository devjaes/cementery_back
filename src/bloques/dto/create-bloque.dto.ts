import { IsNotEmpty, IsString, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateBloqueDto {
  @IsNotEmpty()
  @IsUUID()
  id_cementerio: string;

  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  numero_filas: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  numero_columnas: number;
}