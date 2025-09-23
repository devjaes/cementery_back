import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @ApiProperty({
        description: 'ID único del usuario a actualizar',
        example: '5f8d8f9d-f9c8-4f3d-9c8d-8f9d9c8f9d8f',
        required: true,
        type: String
    })
    @IsString()
    id_user: string;
}