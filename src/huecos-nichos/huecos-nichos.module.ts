import { Module } from '@nestjs/common';
import { HuecosNichosService } from './huecos-nichos.service';
import { HuecosNichosController } from './huecos-nichos.controller';
import { HuecosNicho } from './entities/huecos-nicho.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports:[TypeOrmModule.forFeature([HuecosNicho])],
  controllers: [HuecosNichosController],
  providers: [HuecosNichosService],
  exports: [HuecosNichosService, TypeOrmModule.forFeature([HuecosNicho])],
})
export class HuecosNichosModule {}
