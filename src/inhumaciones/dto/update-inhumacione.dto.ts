import { IsNotEmpty, IsString, IsOptional } from "class-validator";
import { CreateInhumacionDto } from "./create-inhumaciones.dto";
import { PartialType } from "@nestjs/swagger";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ApiExtraModels } from "@nestjs/swagger";

@ApiExtraModels(CreateInhumacionDto)
export class UpdateInhumacionDto extends PartialType(CreateInhumacionDto) {
    @ApiProperty({
        description: 'ID único de la inhumación a actualizar',
        example: '123e4567-e89b-12d3-a456-426614174000',
        format: 'uuid',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    id_inhumacion: string;
}