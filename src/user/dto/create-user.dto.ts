import { IsString, IsEmail, Length, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Cementerio } from "src/cementerio/entities/cementerio.entity";
import { DeepPartial } from "typeorm";

export class CreateUserDto {
    @ApiProperty({
        description: 'Número de cédula del usuario',
        example: '1234567890',
        minLength: 10,
        maxLength: 13,
        required: true
    })
    @IsString()
    @Length(10, 13)
    cedula: string;

    @ApiProperty({
        description: 'Correo electrónico del usuario',
        example: 'usuario@example.com',
        required: true
    })
    @IsString()
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'Nombre del usuario',
        example: 'Juan',
        minLength: 2,
        required: true
    })
    @IsString()
    @Length(2, 50)
    nombre: string;

    @ApiProperty({
        description: 'Apellido del usuario',
        example: 'Pérez',
        minLength: 2,
        required: true
    })
    @IsString()
    @Length(2, 50)
    apellido: string;

    @ApiProperty({
        description: 'Contraseña del usuario (mínimo 8 caracteres)',
        example: 'Password123',
        minLength: 8,
        required: true
    })
    @IsString()
    @Length(8, 100)
    password: string;

    @ApiProperty({
        description: 'Rol del usuario (opcional)',
        example: 'admin',
        required: false
    })
    @IsOptional()
    @IsString()
    rol?: string;
}