import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdatePaymentDto {
  @IsEnum(['pending', 'paid'])
  @IsOptional()
  status?: 'pending' | 'paid';

  @IsString()
  @IsOptional()
  receiptFile?: string;

  @IsString()
  @IsOptional()
  observations?: string;

  @IsString()
  @IsOptional()
  validatedBy?: string;

  @IsDateString()
  @IsOptional()
  paidDate?: Date;
}
