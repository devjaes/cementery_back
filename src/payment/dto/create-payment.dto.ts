import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Matches,
} from 'class-validator';

export class CreatePaymentDto {
  @IsEnum([
    'burial',
    'exhumation',
    'niche_sale',
    'tomb_improvement',
    'hole_extension',
  ])
  @IsNotEmpty()
  procedureType:
    | 'burial'
    | 'exhumation'
    | 'niche_sale'
    | 'tomb_improvement'
    | 'hole_extension';

  @IsUUID()
  @IsNotEmpty()
  procedureId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsString()
  @IsNotEmpty()
  generatedBy: string;

  @IsString()
  @IsOptional()
  observations?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, {
    message: 'La cédula debe tener exactamente 10 dígitos',
  })
  buyerDocument: string;

  @IsString()
  @IsNotEmpty()
  @Matches(
    /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,}\s[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,}\s[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,}\s[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,}$/,
    {
      message:
        'El nombre debe contener 2 nombres y 2 apellidos separados por espacios',
    },
  )
  buyerName: string;

  @IsString()
  @IsOptional()
  buyerDirection?: string;

  @IsString()
  @IsOptional()
  deceasedName?: string;
}
