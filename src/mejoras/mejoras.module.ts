import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mejora } from './entities/mejora.entity';
import { Nicho } from 'src/nicho/entities/nicho.entity';
import { Persona } from 'src/personas/entities/persona.entity';
import { User } from 'src/user/entities/user.entity';
import { MejorasController } from './mejoras.controller';
import { MejorasService } from './mejoras.service';
import { MejorasPdfService } from './mejoras-pdf.service';

@Module({
  imports: [TypeOrmModule.forFeature([Mejora, Nicho, Persona, User])],
  controllers: [MejorasController],
  providers: [MejorasService, MejorasPdfService],
  exports: [MejorasService],
})
export class MejorasModule {}
