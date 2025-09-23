import { PartialType } from '@nestjs/swagger';
import { CreateExumacionDto } from './create-exumacion.dto';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels(CreateExumacionDto)
export class UpdateExumacionDto extends PartialType(CreateExumacionDto) {
  @ApiProperty({
    description: 'ID único de la exhumación a actualizar',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  id_exumacion: string;
}