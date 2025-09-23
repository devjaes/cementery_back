import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateHuecosNichoDto } from './create-huecos-nicho.dto';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UpdateHuecosNichoDto extends PartialType(CreateHuecosNichoDto) {
  @ApiProperty({
    description: 'ID único del hueco a actualizar',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  id_detalle_hueco: string;
}
