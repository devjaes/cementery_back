import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
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
}
