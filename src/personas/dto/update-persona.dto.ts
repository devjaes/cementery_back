import { PartialType } from '@nestjs/mapped-types';
import { CreatePersonaDto } from './create-persona.dto';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels(CreatePersonaDto)
export class UpdatePersonaDto extends PartialType(CreatePersonaDto) {
    @ApiProperty({
        description: 'ID único de la persona',
        example: '123e4567-e89b-12d3-a456-426614174000',
        format: 'uuid',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    id_persona: string;
}