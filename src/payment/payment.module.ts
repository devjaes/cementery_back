import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { Payment } from './entities/payment.entity';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), SharedModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
