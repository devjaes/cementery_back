import { Module } from '@nestjs/common';
import { HuecosNichosService } from './huecos-nichos.service';
import { HuecosNichosController } from './huecos-nichos.controller';
import { HuecosNicho } from './entities/huecos-nicho.entity';
import { Nicho } from 'src/nicho/entities/nicho.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([HuecosNicho, Nicho])],
  controllers: [HuecosNichosController],
  providers: [HuecosNichosService],
  exports: [HuecosNichosService, TypeOrmModule.forFeature([HuecosNicho])],
})
export class HuecosNichosModule {}
