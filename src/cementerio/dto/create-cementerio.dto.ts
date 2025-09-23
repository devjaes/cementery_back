import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCementerioDto {
    @ApiProperty({
        description: 'Nombre del cementerio',
        example: 'Cementerio Municipal de Quito',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @ApiProperty({
        description: 'Dirección del cementerio',
        example: 'Av. Galo Plaza Lasso S/N',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    direccion: string;

    @ApiProperty({
        description: 'Teléfono de contacto del cementerio',
        example: '+593 2 1234567',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    telefono: string;

    @ApiProperty({
        description: 'Nombre del responsable del cementerio',
        example: 'Juan Pérez',
        required: true
    })
    @IsString()
    @IsNotEmpty()
    responsable: string;
}