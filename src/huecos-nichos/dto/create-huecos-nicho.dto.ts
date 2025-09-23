import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Nicho } from 'src/nicho/entities/nicho.entity';
import { Persona } from 'src/personas/entities/persona.entity';
import { DeepPartial } from 'typeorm';

export class CreateHuecosNichoDto {
  @ApiProperty({
    description: 'ID del nicho al que pertenece el hueco',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    required: true,
  })
  @IsNotEmpty()
  @IsUUID()
  id_nicho: DeepPartial<Nicho>;

  @ApiPropertyOptional({
    description:
      'Estado del hueco (Disponible, Ocupado, Reservado). Si no se proporciona, se asigna "Disponible" por defecto',
    example: 'Disponible',
    required: false,
    enum: ['Disponible', 'Ocupado', 'Reservado'],
    default: 'Disponible',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  estado?: string;

  @ApiPropertyOptional({
    description: 'ID del fallecido asociado al hueco (opcional)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  id_fallecido?: DeepPartial<Persona>;

  @ApiPropertyOptional({
    description: 'Número de hueco del nicho',
    example: 2,
    required: false,
  })
  @IsOptional()
  num_hueco?: number;
}