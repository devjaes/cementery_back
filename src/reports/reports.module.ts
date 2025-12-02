import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PropietarioNicho } from '../propietarios-nichos/entities/propietarios-nicho.entity';
import { Inhumacion } from '../inhumaciones/entities/inhumacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PropietarioNicho, Inhumacion])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
