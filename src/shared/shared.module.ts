import { Module } from '@nestjs/common';
import { PDFGeneratorService } from './pdf-generator/pdf-generator.service';

@Module({
  providers: [PDFGeneratorService],
  exports: [PDFGeneratorService],
})
export class SharedModule {}
