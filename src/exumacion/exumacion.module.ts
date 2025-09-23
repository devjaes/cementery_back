// src/exhumacion/exhumacion.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exumacion } from './entities/exumacion.entity';
import { ExumacionController } from './exumacion.controller';
import { ExumacionService } from './exumacion.service';
import { Nicho } from '../nicho/entities/nicho.entity'; // Asegúrate de que la ruta sea correcta

@Module({
  imports: [
    TypeOrmModule.forFeature([Exumacion, Nicho]),
  ],
  controllers: [ExumacionController],
  providers: [ExumacionService],
  exports: [ExumacionService]
})
export class ExumacionModule {}