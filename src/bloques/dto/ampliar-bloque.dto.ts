import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsInt,
    Min,
    IsString,
    MaxLength,
    IsOptional,
} from 'class-validator';

export class AmpliarBloqueDto {
    @ApiProperty({
        description: 'Número de filas a agregar al mausoleo',
        example: 2,
        minimum: 1,
        required: true,
    })
    @IsNotEmpty({ message: 'El número de filas es requerido' })
    @IsInt({ message: 'El número de filas debe ser un número entero' })
    @Min(1, { message: 'Debe agregar al menos 1 fila' })
    numero_filas: number;

    @ApiProperty({
        description:
            'Número de columnas (debe coincidir con el número de columnas original del bloque)',
        example: 3,
        minimum: 1,
        required: true,
    })
    @IsNotEmpty({ message: 'El número de columnas es requerido' })
    @IsInt({ message: 'El número de columnas debe ser un número entero' })
    @Min(1, { message: 'El número de columnas debe ser al menos 1' })
    numero_columnas: number;

    @ApiProperty({
        description: 'Observación sobre la ampliación del mausoleo',
        example: 'Ampliación autorizada por la familia, construcción fase 2',
        required: true,
    })
    @IsNotEmpty({ message: 'La observación de ampliación es requerida' })
    @IsString({ message: 'La observación debe ser un texto' })
    @MaxLength(1000, {
        message: 'La observación no puede exceder 1000 caracteres',
    })
    observacion_ampliacion: string;
}
