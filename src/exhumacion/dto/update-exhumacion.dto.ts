import { PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateExhumacionDto } from './create-exhumacion.dto';

export class UpdateExhumacionDto extends PartialType(CreateExhumacionDto) {
  @ApiProperty({ description: 'ID de la exhumación', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  id_exhumacion: string;

  @ApiProperty({ description: 'Archivo de pago para finalizar', example: 'pago.pdf', required: false })
  @IsString()
  @IsNotEmpty()
  comprobante_pago?: string;
}
