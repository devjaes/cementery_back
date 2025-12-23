import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BloquesService } from './bloques.service';
import { BloquesController } from './bloques.controller';
import { Bloque } from './entities/bloque.entity';
import { Cementerio } from 'src/cementerio/entities/cementerio.entity';
import { Nicho } from 'src/nicho/entities/nicho.entity';
import { HuecosNicho } from 'src/huecos-nichos/entities/huecos-nicho.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bloque, Cementerio, Nicho, HuecosNicho])],
  controllers: [BloquesController],
  providers: [BloquesService],
  exports: [BloquesService, TypeOrmModule],
})
export class BloquesModule {}