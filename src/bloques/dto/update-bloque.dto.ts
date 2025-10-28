import { PartialType } from '@nestjs/mapped-types';
import { CreateBloqueDto } from './create-bloque.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateBloqueDto extends PartialType(CreateBloqueDto) {
  @IsOptional()
  @IsString()
  estado?: string;
}