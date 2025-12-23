import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsDateString,
  IsOptional,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Cementerio } from 'src/cementerio/entities/cementerio.entity';
import { DeepPartial } from 'typeorm';

export class CreateNichoDto {
  @ApiProperty({
    description: 'ID del cementerio al que pertenece el nicho',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    required: true,
  })
  @IsNotEmpty()
  @IsUUID()
  id_cementerio: DeepPartial<Cementerio>;

  @ApiProperty({
    description: 'Número de fila del nicho',
    example: 1,
    minimum: 1,
    required: true,
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  fila: number;

  @ApiProperty({
    description: 'Número de columna del nicho',
    example: 5,
    minimum: 1,
    required: true,
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  columna: number;
}
