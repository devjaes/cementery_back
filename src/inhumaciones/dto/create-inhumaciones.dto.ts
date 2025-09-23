import { IsDate, IsNotEmpty, IsString, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Nicho } from "src/nicho/entities/nicho.entity";
import { Persona } from "src/personas/entities/persona.entity";
import { DeepPartial } from "typeorm";
import { RequisitosInhumacion } from "src/requisitos-inhumacion/entities/requisitos-inhumacion.entity";

export class CreateInhumacionDto {
    @ApiProperty({
        description: 'ID del nicho donde se realizará la inhumación',
        example: '123e4567-e89b-12d3-a456-426614174000',
        format: 'uuid',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    id_nicho: DeepPartial<Nicho>;

    @ApiProperty({
        description: 'ID del fallecido a inhumar',
        example: '123e4567-e89b-12d3-a456-426614174001',
        format: 'uuid',
        required: true
    })
    @IsNotEmpty()
    id_fallecido: DeepPartial<Persona>;

    @ApiProperty({
        description: 'Fecha de inhumación (YYYY-MM-DD)',
        example: '2023-06-15',
        required: true
    })
    @IsDate()
    @IsNotEmpty()
    fecha_inhumacion: string;

    @ApiProperty({
        description: 'Hora de inhumación (HH:MM)',
        example: '14:30',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    hora_inhumacion: string;

    @ApiProperty({
        description: 'Nombre del solicitante',
        example: 'Juan Pérez',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    solicitante: string;

    @ApiProperty({
        description: 'Nombre del responsable de la inhumación',
        example: 'Carlos Gómez',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    responsable_inhumacion: string;

    @ApiPropertyOptional({
        description: 'Observaciones adicionales',
        example: 'Requiere traslado desde otro cementerio',
        required: false
    })
    @IsString()
    @IsOptional()
    observaciones: string;

    @ApiProperty({
        description: 'Código único de inhumación',
        example: 'INH-2023-001',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    codigo_inhumacion: string;

    @ApiProperty({
        description: 'Estado de la inhumación',
        enum: ['Realizada','Pendiente'],
        example: 'Programada',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    estado: string;

    @ApiProperty({
        description: 'ID de los requisitos de inhumación asociados',
        example: '123e4567-e89b-12d3-a456-426614174002',
        format: 'uuid',
        required: true
    })
    @IsString()
    @IsOptional()
    id_requisitos_inhumacion?: DeepPartial<RequisitosInhumacion>;
}