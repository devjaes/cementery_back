import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsDateString,
  IsOptional,
  MaxLength,
  Min,
  IsEnum,
  ValidateIf,
  Max,
} from 'class-validator';
import { TipoNicho } from '../enum/tipoNicho.enum';

export class HabilitarNichoDto {
  @ApiProperty({
    description: 'Tipo de nicho',
    enum: TipoNicho,
    example: TipoNicho.NICHO,
    required: true,
  })
  @IsEnum(TipoNicho, {
    message: 'El tipo debe ser: Nicho, Mausoleo, Fosa o Bóveda',
  })
  @IsNotEmpty()
  tipo: TipoNicho;

  @ApiProperty({
    description: 'Cantidad de huecos del nicho. Nicho/Mausoleo: ilimitados. Fosa/Bóveda: solo 1',
    example: 2,
    minimum: 1,
    required: true,
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1, { message: 'El nicho debe tener al menos 1 hueco' })
  @ValidateIf((o) => o.tipo === TipoNicho.FOSA || o.tipo === TipoNicho.BOVEDA)
  @Max(1, {
    message: 'Fosa y Bóveda solo pueden tener exactamente 1 hueco',
  })
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
