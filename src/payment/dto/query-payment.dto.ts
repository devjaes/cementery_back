import { IsEnum, IsOptional, IsString } from 'class-validator';

export class QueryPaymentDto {
  @IsEnum([
    'burial',
    'exhumation',
    'niche_sale',
    'tomb_improvement',
    'hole_extension',
  ])
  @IsOptional()
  procedureType?: string;

  @IsEnum(['pending', 'paid'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  generatedBy?: string;

  @IsString()
  @IsOptional()
  paymentCode?: string;
}
