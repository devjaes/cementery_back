import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AprobarMejoraDto {
  @ApiProperty({ description: 'Identificador del usuario que aprueba', format: 'uuid' })
  @IsUUID()
  aprobadoPorId: string;
}
