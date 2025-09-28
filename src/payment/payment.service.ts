import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { PDFGeneratorService } from '../shared/pdf-generator/pdf-generator.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly pdfGeneratorService: PDFGeneratorService,
  ) {}

  private generatePaymentCode(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    const timeCode = `${hours}${minutes}${seconds}`;
    const randomSuffix = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, '0');

    const baseCode = `${year}${month}${day}${timeCode}${randomSuffix}`;
    const checkDigit = this.calculateCheckDigit(baseCode);

    return `PAY-${year}${month}${day}-${timeCode}-${randomSuffix}${checkDigit}`;
  }

  private calculateCheckDigit(code: string): string {
    const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7];
    let sum = 0;

    for (let i = 0; i < code.length && i < weights.length; i++) {
      sum += parseInt(code[i]) * weights[i];
    }

    const remainder = sum % 10;
    const checkDigit = remainder === 0 ? 0 : 10 - remainder;

    return checkDigit.toString();
  }

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const paymentCode = this.generatePaymentCode();

    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      paymentCode,
      status: 'pending',
    });

    return await this.paymentRepository.save(payment);
  }

  async findAll(queryDto: QueryPaymentDto): Promise<Payment[]> {
    const query = this.paymentRepository.createQueryBuilder('payment');

    if (queryDto.procedureType) {
      query.andWhere('payment.procedureType = :procedureType', {
        procedureType: queryDto.procedureType,
      });
    }

    if (queryDto.status) {
      query.andWhere('payment.status = :status', { status: queryDto.status });
    }

    if (queryDto.generatedBy) {
      query.andWhere('payment.generatedBy ILIKE :generatedBy', {
        generatedBy: `%${queryDto.generatedBy}%`,
      });
    }

    if (queryDto.paymentCode) {
      query.andWhere('payment.paymentCode ILIKE :paymentCode', {
        paymentCode: `%${queryDto.paymentCode}%`,
      });
    }

    query.orderBy('payment.generatedDate', 'DESC');
    return await query.getMany();
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentId: id },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async findByCode(code: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentCode: code },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with code ${code} not found`);
    }

    return payment;
  }

  async findByProcedure(
    procedureType: string,
    procedureId: string,
  ): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: {
        procedureType: procedureType as
          | 'burial'
          | 'exhumation'
          | 'niche_sale'
          | 'tomb_improvement'
          | 'hole_extension',
        procedureId: procedureId,
      },
      order: { generatedDate: 'DESC' },
    });
  }

  async update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    const payment = await this.findOne(id);

    if (updatePaymentDto.status === 'paid' && payment.status === 'pending') {
      updatePaymentDto.paidDate = new Date();
    }

    if (updatePaymentDto.receiptFile) {
      const trimmedPath = updatePaymentDto.receiptFile.trim();

      if (trimmedPath === '') {
        delete updatePaymentDto.receiptFile;
      } else {
        if (payment.receiptFile) {
          throw new BadRequestException(
            'Ya existe una constancia de pago para este registro',
          );
        }
      }
    }

    Object.assign(payment, updatePaymentDto);
    return await this.paymentRepository.save(payment);
  }

  async confirmPayment(
    id: string,
    validatedBy: string,
    filePath?: string,
  ): Promise<Payment> {
    return await this.update(id, {
      status: 'paid',
      validatedBy: validatedBy,
      paidDate: new Date(),
      receiptFile: filePath,
    });
  }

  async remove(id: string): Promise<void> {
    const payment = await this.findOne(id);

    if (payment.status === 'paid') {
      throw new BadRequestException('Cannot delete a confirmed payment');
    }

    await this.paymentRepository.remove(payment);
  }

  async generateReceipt(id: string): Promise<string> {
    const payment = await this.findOne(id);
    return await this.pdfGeneratorService.generarReciboPago(payment);
  }
}
