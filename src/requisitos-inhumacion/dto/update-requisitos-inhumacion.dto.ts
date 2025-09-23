import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateRequisitosInhumacionDto } from './create-requisitos-inhumacion.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateRequisitosInhumacionDto extends PartialType(CreateRequisitosInhumacionDto) {
    @ApiProperty({
        description: 'ID del requisito de inhumación a actualizar',
        example: 'uuid-requisito-inhumacion'
    })
    @IsString()
    @IsNotEmpty()
    id_requsitoInhumacion: string;
}
