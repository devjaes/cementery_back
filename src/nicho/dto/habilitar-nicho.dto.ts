import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsDateString,
  IsOptional,
  MaxLength,
  Min,
} from 'class-validator';

export class HabilitarNichoDto {
  @ApiProperty({
    description: 'Tipo de nicho',
    enum: ['Nicho', 'Mausoleo', 'Fosa', 'Bóveda'],
    example: 'Nicho',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @ApiProperty({
    description: 'Cantidad de huecos del nicho',
    example: 2,
    minimum: 1,
    required: true,
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1, { message: 'El nicho debe tener al menos 1 hueco' })
  num_huecos: number;

  @ApiProperty({
    description: 'Fecha de construcción del nicho',
    type: 'string',
    format: 'date',
    example: '2023-01-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  fecha_construccion?: string;

  @ApiProperty({
    description: 'Observaciones adicionales sobre el nicho',
    example: 'Nicho habilitado con características especiales',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, {
    message: 'Las observaciones no deben exceder los 500 caracteres',
  })
  observaciones?: string;
}
