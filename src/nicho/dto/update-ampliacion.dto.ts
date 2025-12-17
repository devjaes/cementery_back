import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    MaxLength,
    IsOptional,
} from 'class-validator';

export class UpdateAmpliacionDto {
    @ApiPropertyOptional({
        description: 'Nueva observación sobre la ampliación del mausoleo',
        example: 'Ampliación actualizada - documentación revisada',
        required: false,
    })
    @IsOptional()
    @IsString({ message: 'La observación debe ser un texto' })
    @MaxLength(1000, {
        message: 'La observación no puede exceder 1000 caracteres',
    })
    observacion_ampliacion?: string;
}
