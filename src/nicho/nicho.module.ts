import { Module } from '@nestjs/common';
import { NichoService } from './nicho.service';
import { NichosController } from './nicho.controller';
import { NicheSalesService } from './sales.service';
import { NicheSalesController } from './sales.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Nicho } from './entities/nicho.entity';
import { HuecosNicho } from 'src/huecos-nichos/entities/huecos-nicho.entity';
import { Persona } from 'src/personas/entities/persona.entity';
import { PropietarioNicho } from 'src/propietarios-nichos/entities/propietarios-nicho.entity';
import { Bloque } from 'src/bloques/entities/bloque.entity';
import { PaymentModule } from 'src/payment/payment.module';
import { PropietariosNichosModule } from 'src/propietarios-nichos/propietarios-nichos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Nicho, HuecosNicho, Persona, PropietarioNicho, Bloque]),
    PaymentModule,
    PropietariosNichosModule,
  ],
  controllers: [NichosController, NicheSalesController],
  providers: [NichoService, NicheSalesService],
  exports: [NichoService, NicheSalesService],
})
export class NichoModule {}
