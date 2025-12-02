import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exhumacion } from './entities/exhumacion.entity';
import { ExhumacionService } from './exhumacion.service';
import { ExhumacionController } from './exhumacion.controller';
import { Nicho } from '../nicho/entities/nicho.entity';
import { Inhumacion } from '../inhumaciones/entities/inhumacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Exhumacion, Nicho, Inhumacion])],
  controllers: [ExhumacionController],
  providers: [ExhumacionService],
  exports: [ExhumacionService],
})
export class ExhumacionModule {}
