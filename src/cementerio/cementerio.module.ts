import { Module } from '@nestjs/common';
import { CementerioService } from './cementerio.service';
import { CementerioController } from './cementerio.controller';
import { Cementerio } from './entities/cementerio.entity';
import { Bloque } from 'src/bloques/entities/bloque.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Cementerio, Bloque])],
  controllers: [CementerioController],
  providers: [CementerioService],
  exports: [CementerioService], // Export CementerioService to be used in other modules
})
export class CementerioModule {}
