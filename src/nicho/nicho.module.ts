import { Module } from '@nestjs/common';
import { NichoService } from './nicho.service';
import { NichosController } from './nicho.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Nicho } from './entities/nicho.entity';
import { HuecosNicho } from 'src/huecos-nichos/entities/huecos-nicho.entity';
import { Persona } from 'src/personas/entities/persona.entity';
import { PropietarioNicho } from 'src/propietarios-nichos/entities/propietarios-nicho.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Nicho, HuecosNicho, Persona, PropietarioNicho])],
  controllers: [NichosController],
  providers: [NichoService],
  exports: [NichoService]
})
export class NichoModule {}
