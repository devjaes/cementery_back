import { IsDate, IsNotEmpty, IsString, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Nicho } from "src/nicho/entities/nicho.entity";
import { Persona } from "src/personas/entities/persona.entity";
import { DeepPartial } from "typeorm";

export enum TipoPropietario {
  Dueño = 'Dueño',
  Heredero = 'Heredero'
}

export class CreatePropietarioNichoDto {
    @ApiProperty({
        description: 'ID de la persona propietaria',
        type: 'string',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: true
    })
    @IsNotEmpty()
    id_persona: DeepPartial<Persona>;

    @ApiProperty({
        description: 'ID del nicho asociado',
        type: 'string',
        example: '123e4567-e89b-12d3-a456-426614174001',
        required: true
    })
    @IsNotEmpty()
    id_nicho: DeepPartial<Nicho>;

    @ApiProperty({
        description: 'Fecha de adquisición del nicho',
        type: 'string',
        format: 'date-time',
        example: '2023-01-15T00:00:00.000Z',
        required: true
    })
    @IsDate()
    @IsNotEmpty()
    fecha_adquisicion: Date;

    @ApiProperty({
        description: 'Tipo de documento de adquisición',
        enum: ['Escritura', 'Contrato', 'Factura', 'Otro'],
        example: 'Escritura',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    tipo_documento: string;

    @ApiProperty({
        description: 'Número del documento de adquisición',
        example: 'DOC-2023-001',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    numero_documento: string;
    
    @ApiProperty({
        description: 'Razon de adquisición del nicho',
        example: 'Adquisición por compra directa',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    razon: string;

    @ApiProperty({
        description: 'Tipo de propietario',
        enum: TipoPropietario,
        example: 'Dueño',
        required: true
    })
    @IsEnum(TipoPropietario)
    @IsNotEmpty()
    tipo: TipoPropietario;
}