import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsDate, IsBoolean, Length, IsUUID } from "class-validator";

export class CreatePersonaDto {
  @ApiProperty({ description: 'Número de cédula de identidad', example: '1234567890', minLength: 10, maxLength: 13 })
  @IsString()
  @Length(10, 13)
  cedula: string;

  @ApiProperty({ description: 'Nombres de la persona', example: 'Juan Carlos', minLength: 2 })
  @IsString()
  @Length(2, 100)
  nombres: string;

  @ApiProperty({ description: 'Apellidos de la persona', example: 'Pérez González', minLength: 2 })
  @IsString()
  @Length(2, 100)
  apellidos: string;

  @ApiPropertyOptional({ description: 'Fecha de nacimiento', type: 'string', format: 'date', example: '1990-05-15' })
  @IsOptional()
  @IsDate()
  fecha_nacimiento?: Date;

  @ApiPropertyOptional({ description: 'Fecha de defunción', type: 'string', format: 'date', example: '2023-01-10' })
  @IsOptional()
  @IsDate()
  fecha_defuncion?: Date;

  @ApiPropertyOptional({ description: 'Fecha de inhumación', type: 'string', format: 'date', example: '2023-01-12' })
  @IsOptional()
  @IsDate()
  fecha_inhumacion?: Date;

  @ApiPropertyOptional({ description: 'Lugar de defunción', example: 'Hospital General, Quito' })
  @IsOptional()
  @IsString()
  lugar_defuncion?: string;

  @ApiPropertyOptional({ description: 'Causa de defunción', example: 'Enfermedad cardiovascular' })
  @IsOptional()
  @IsString()
  causa_defuncion?: string;

  @ApiPropertyOptional({ description: 'Dirección domiciliaria', example: 'Av. Amazonas N23-45 y Veintimilla' })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional({ description: 'Número de teléfono', example: '+593987654321' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ description: 'Correo electrónico', example: 'juan.perez@example.com' })
  @IsOptional()
  @IsString()
  correo?: string;

  @ApiPropertyOptional({ description: 'Indica si la persona está fallecida', default: false })
  @IsOptional()
  @IsBoolean()
  fallecido?: boolean;

   @ApiPropertyOptional({ description: 'Indica la nacionalidad de la persona  fallecida', default: false })
  @IsOptional()
  @IsString()
  nacionalidad?: string;
}