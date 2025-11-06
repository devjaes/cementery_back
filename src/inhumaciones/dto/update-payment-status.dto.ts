import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePaymentStatusDto {
  @ApiProperty({
    description: 'Nuevo estado de pago de la inhumación',
    enum: ['pending', 'paid'],
    example: 'paid',
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(['pending', 'paid'], {
    message: 'El estado de pago debe ser "pending" o "paid"',
  })
  paymentStatus: 'pending' | 'paid';
}
