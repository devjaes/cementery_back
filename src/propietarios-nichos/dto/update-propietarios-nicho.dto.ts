import { PartialType } from '@nestjs/mapped-types';
import { CreatePropietarioNichoDto } from './create-propietarios-nicho.dto';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePropietarioNichoDto extends PartialType(CreatePropietarioNichoDto) {
    @ApiProperty({
        description: 'ID único del registro de propietario de nicho',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: true,
        type: String
    })
    @IsString()
    @IsNotEmpty()
    id_propietario_nicho: string;
}