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
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { TipoNicho, validarNumHuecosPorTipo, obtenerMensajeErrorHuecos } from '../enum/tipoNicho.enum';

export class HabilitarNichoDto {
  @ApiProperty({
    description: 'Tipo de nicho',
    enum: TipoNicho,
    enumName: 'TipoNicho',
    example: TipoNicho.NICHO,
    required: true,
    examples: {
      nicho: { value: TipoNicho.NICHO, description: 'Permite múltiples huecos sin límite' },
      mausoleo: { value: TipoNicho.MAUSOLEO, description: 'Permite múltiples huecos sin límite' },
      fosa: { value: TipoNicho.FOSA, description: 'Solo permite 1 hueco' },
      boveda: { value: TipoNicho.BOVEDA, description: 'Solo permite 1 hueco' },
    },
  })
  @IsEnum(TipoNicho, { message: 'Tipo de nicho no válido. Debe ser: Nicho, Mausoleo, Fosa o Bóveda' })
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
  @ValidarHuecosPorTipo({
    message: 'Número de huecos inválido para el tipo de nicho seleccionado',
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

/**
 * Validador personalizado para verificar que num_huecos sea válido según el tipo de nicho
 */
function ValidarHuecosPorTipo(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'validarHuecosPorTipo',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const dto = args.object as HabilitarNichoDto;
          if (!dto.tipo || !value) return true; // Dejar que otros validadores manejen campos vacíos
          return validarNumHuecosPorTipo(dto.tipo as TipoNicho, value);
        },
        defaultMessage(args: ValidationArguments) {
          const dto = args.object as HabilitarNichoDto;
          if (!dto.tipo) return 'Tipo de nicho requerido';
          return obtenerMensajeErrorHuecos(dto.tipo as TipoNicho);
        },
      },
    });
  };
}