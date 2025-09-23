import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, IsDateString, IsOptional, IsUUID, MaxLength, Min, Max, Length, IsDate } from 'class-validator';
import { Cementerio } from 'src/cementerio/entities/cementerio.entity';
import { DeepPartial } from 'typeorm';

export class CreateNichoDto {
  @ApiProperty({
    description: 'ID del cementerio al que pertenece el nicho',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    required: true
  })
  @IsNotEmpty()
  @IsUUID()
  id_cementerio: DeepPartial<Cementerio>;

  @ApiProperty({
    description: 'Sector del nicho (ej. A, B, C)',
    example: 'A',
    minLength: 1,
    maxLength: 2,
    required: true
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 2)
  sector: string;

  @ApiProperty({
    description: 'Fila del nicho',
    example: '1',
    minLength: 1,
    maxLength: 3,
    required: true
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 3)
  fila: string;

  @ApiProperty({
    description: 'Número del nicho',
    example: '15',
    minLength: 1,
    maxLength: 4,
    required: true
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 4)
  numero: string;

  @ApiProperty({
    description: 'Tipo de nicho',
    enum: ['Nicho', 'Mausoleo', 'Fosa'],
    example: 'Individual',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @ApiProperty({
    description: 'Fecha de construcción del nicho',
    type: 'string',
    format: 'date',
    example: '2023-01-01',
    required: true
  })
  @IsDateString()
  @IsNotEmpty()
  fecha_construccion: string;

  @ApiProperty({
    description: 'Fecha de adquisición del nicho',
    type: 'string',
    format: 'date',
    example: '2023-01-01',
    required: true
  })
  // @IsDate()
  // @IsOptional()
  // fecha_adquisicion?: Date;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales sobre el nicho',
    example: 'Construido recientemente con mármol importado',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Las observaciones no deben exceder los 500 caracteres' })
  observaciones?: string;

  @ApiProperty({
    description: 'Cantidad de huecos del nicho',
    example: 2,
    required: true
  })
  @IsInt()
  @IsNotEmpty()
  num_huecos: number;

}