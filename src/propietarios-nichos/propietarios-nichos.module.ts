import { Module } from '@nestjs/common';
import { PropietariosNichosService } from './propietarios-nichos.service';
import { PropietariosNichosController } from './propietarios-nichos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Persona } from 'src/personas/entities/persona.entity';
import { PropietarioNicho } from './entities/propietarios-nicho.entity';
import { Nicho } from 'src/nicho/entities/nicho.entity'; // Importa la entidad Nicho si es necesario

@Module({
  imports: [TypeOrmModule.forFeature([PropietarioNicho, Persona, Nicho])], // Registra la entidad PropietarioNicho aquí
  controllers: [PropietariosNichosController],
  providers: [PropietariosNichosService],
  exports: [PropietariosNichosService], // Exporta el servicio si es necesario en otros módulos

})
export class PropietariosNichosModule {}
