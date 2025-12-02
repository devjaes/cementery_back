import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class NegarMejoraDto {
  @ApiProperty({ description: 'Identificador del usuario que niega la mejora', format: 'uuid' })
  @IsUUID()
  negadoPorId: string;
}
