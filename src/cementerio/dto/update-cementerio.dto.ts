import { PartialType } from '@nestjs/swagger';
import { CreateCementerioDto } from './create-cementerio.dto';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels(CreateCementerioDto)
export class UpdateCementerioDto extends PartialType(CreateCementerioDto) {
    @ApiProperty({
        description: 'ID único del cementerio',
        example: '123e4567-e89b-12d3-a456-426614174000',
        format: 'uuid',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    id_cementerio: string;
}