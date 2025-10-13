import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, renameSync, unlinkSync } from 'fs';
import { Response } from 'express';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
    @Res() res: Response,
  ) {
    try {
      const payment = await this.paymentService.create(createPaymentDto);
      const receiptPath = await this.paymentService.generateReceipt(
        payment.paymentId,
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="recibo-pago-${payment.paymentId}.pdf"`,
      );
      res.setHeader('X-Payment-Data', JSON.stringify(payment));
      res.setHeader('Access-Control-Expose-Headers', 'X-Payment-Data');

      return res.sendFile(receiptPath);
    } catch (error) {
      // Log the error if desired, e.g., console.error(error);
      return res.status(500).json({
        message: 'Failed to generate payment receipt.',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  @Get()
  async findAll(@Query() queryDto: QueryPaymentDto) {
    return await this.paymentService.findAll(queryDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.paymentService.findOne(id);
  }

  @Get('code/:code')
  async findByCode(@Param('code') code: string) {
    return await this.paymentService.findByCode(code);
  }

  @Get('procedure/:type/:id')
  async findByProcedure(
    @Param('type') type: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.paymentService.findByProcedure(type, id);
  }

  @Get(':id/receipt')
  async generateReceipt(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const pdfPath = await this.paymentService.generateReceipt(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="recibo-pago-${id}.pdf"`,
    );

    return res.sendFile(pdfPath);
  }

  @Post(':id/receipt')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = process.env.UPLOAD_PATH || './uploads';
          const tempPath = join(uploadPath, 'temp');

          if (!existsSync(tempPath)) {
            mkdirSync(tempPath, { recursive: true });
          }

          cb(null, tempPath);
        },
        filename: (req, file, cb) => {
          const uniqueName = `temp-${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extName = allowedTypes.test(
          extname(file.originalname).toLowerCase(),
        );
        const mimeType = allowedTypes.test(file.mimetype);

        if (extName && mimeType) {
          return cb(null, true);
        } else {
          cb(
            new Error('Solo se permiten archivos de tipo PDF, JPG, JPEG o PNG'),
            false,
          );
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async uploadReceipt(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('validatedBy') validatedBy: string,
  ) {
    const tempFilePath = file.path;

    try {
      const uploadPath = process.env.UPLOAD_PATH || './uploads';
      const receiptsPath = join(uploadPath, 'receipts');

      if (!existsSync(receiptsPath)) {
        mkdirSync(receiptsPath, { recursive: true });
      }

      const finalFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
      const finalFilePath = join(receiptsPath, finalFileName);

      const payment = await this.paymentService.confirmPayment(
        id,
        validatedBy,
        finalFilePath,
      );

      renameSync(tempFilePath, finalFilePath);

      return payment;
    } catch (error) {
      if (existsSync(tempFilePath)) {
        unlinkSync(tempFilePath);
      }
      throw error;
    }
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    return await this.paymentService.update(id, updatePaymentDto);
  }

  @Patch(':id/confirm')
  async confirmPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('validatedBy') validatedBy: string,
  ) {
    return await this.paymentService.confirmPayment(id, validatedBy);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.paymentService.remove(id);
    return;
  }
}
