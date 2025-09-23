import {
  IsString,
  IsIn,
  IsDate,
  IsBoolean,
  IsOptional,
  IsNumber,
  ValidateNested,
  IsObject,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Nicho } from 'src/nicho/entities/nicho.entity';
import { Inhumacion } from 'src/inhumaciones/entities/inhumacion.entity';

class RequisitoDto {
  @ApiProperty({ description: 'Indica si el requisito se cumple', example: true })
  @IsBoolean()
  cumple: boolean;

  @ApiPropertyOptional({ description: 'Observaciones sobre el requisito', example: 'Documento en buen estado' })
  @IsString()
  @IsOptional()
  observacion?: string;
}

export class CreateExumacionDto {
  @ApiProperty({ 
    description: 'ID de la inhumación relacionada', 
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  id_inhumacion: Inhumacion;
  
  @ApiProperty({ 
    description: 'Método de solicitud', 
    enum: ['escrito', 'verbal'], 
    example: 'escrito' 
  })
  @IsString()
  @IsIn(['escrito', 'verbal'])
  metodo_solicitud: 'escrito' | 'verbal';

  @ApiProperty({ 
    description: 'ID del solicitante', 
    example: '123e4567-e89b-12d3-a456-426614174001' 
  })
  @IsString()
  solicitante_id: string;

  @ApiProperty({ 
    description: 'Parentesco con el fallecido', 
    example: 'Hijo' 
  })
  @IsString()
  parentesco: string;

  @ApiProperty({ 
    description: 'ID del fallecido', 
    example: '123e4567-e89b-12d3-a456-426614174002' 
  })
  @IsString()
  fallecido_id: string;

  @ApiProperty({ 
    description: 'ID del nicho original', 
    example: '123e4567-e89b-12d3-a456-426614174003' 
  })
  @IsString()
  nicho_original_id: Nicho;

  @ApiPropertyOptional({ 
    description: 'Nuevo lugar de destino', 
    example: 'Cementerio Municipal' 
  })
  @IsString()
  @IsOptional()
  nuevo_lugar?: string;

  @ApiProperty({ 
    description: 'Fecha de exhumación', 
    type: 'string', 
    format: 'date', 
    example: '2023-01-01' 
  })
  @IsDate()
  @Type(() => Date)
  fecha_exhumacion: Date;

  @ApiProperty({ 
    description: 'Hora de exhumación (formato HH:MM)', 
    example: '14:30' 
  })
  @IsString()
  hora_exhumacion: string;

  @ApiProperty({
    description: 'Requisitos para la exhumación',
    type: 'object',
    additionalProperties: true,
    example: {
      certificado_defuncion: { cumple: true, observacion: 'Presentado' },
      certificado_inhumacion: { cumple: true },
      copia_ci: { cumple: false, observacion: 'Falta copia' },
      titulo_propiedad: { cumple: true },
      certificado_municipal: { cumple: true },
      tiempo_minimo: { cumple: true },
      orden_judicial: { cumple: false, observacion: 'En trámite' },
      pago: { cumple: true }
    }
  })
  @IsObject()
  @ValidateNested()
  @Type(() => RequisitoDto)
  requisitos: {
    certificado_defuncion: RequisitoDto;
    certificado_inhumacion: RequisitoDto;
    copia_ci: RequisitoDto;
    titulo_propiedad: RequisitoDto;
    certificado_municipal: RequisitoDto;
    tiempo_minimo: RequisitoDto;
    orden_judicial: RequisitoDto;
    pago: RequisitoDto;
  };
}