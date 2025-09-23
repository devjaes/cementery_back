import { PartialType } from '@nestjs/mapped-types';
import { CreateNichoDto } from './create-nicho.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels(CreateNichoDto)
export class UpdateNichoDto extends PartialType(CreateNichoDto) {
  @ApiProperty({
    description: 'ID único del nicho a actualizar',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  id_nicho: string;
}