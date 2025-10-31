import { PartialType } from '@nestjs/mapped-types';
import { CreateMejoraDto } from './create-mejora.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UpdateMejoraDto extends PartialType(CreateMejoraDto) {
  @ApiProperty({ description: 'Identificador de la mejora a actualizar' })
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  id_mejora: string;
}
