import { IsNotEmpty, IsString, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBloqueEnCementerioDto {
  @ApiProperty({
    description: 'Nombre del bloque',
    example: 'Bloque A',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({
    description: 'Descripción del bloque',
    example: 'Bloque principal del cementerio',
    required: false,
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({
    description: 'Número de filas del bloque',
    example: 10,
    required: true,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  numero_filas: number;

  @ApiProperty({
    description: 'Número de columnas del bloque',
    example: 15,
    required: true,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  numero_columnas: number;
}