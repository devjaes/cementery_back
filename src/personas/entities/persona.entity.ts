import { HuecosNicho } from 'src/huecos-nichos/entities/huecos-nicho.entity';
import { Inhumacion } from 'src/inhumaciones/entities/inhumacion.entity';
import { PropietarioNicho } from 'src/propietarios-nichos/entities/propietarios-nicho.entity';
import { RequisitosInhumacion } from 'src/requisitos-inhumacion/entities/requisitos-inhumacion.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, BeforeInsert, BeforeUpdate } from 'typeorm';

@Entity('personas')
export class Persona {
  @PrimaryGeneratedColumn('uuid')
  id_persona: string;

  @Column({ type: 'varchar', length: 100, unique: true}) cedula: string;
  @Column({ type: 'varchar', length: 100 }) nombres: string;
  @Column({type: 'varchar', length: 100 }) apellidos: string;
  @Column({ type: 'date', nullable: true }) fecha_nacimiento: Date;
  @Column({ type: 'date', nullable: true }) fecha_defuncion: Date;
  @Column({ type: 'date', nullable: true }) fecha_inhumacion: Date;
  @Column({ type: 'varchar', length: 100, nullable: true }) lugar_defuncion: string;
  @Column({ type: 'varchar', length: 100 ,nullable: true }) causa_defuncion: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) direccion: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) telefono: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) correo: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) nacionalidad: string;
  @Column({ type: 'boolean', default: false}) fallecido: boolean;
  @Column({ type: 'timestamp' }) fecha_creacion: Date;
  @Column({ type: 'timestamp', nullable: true }) fecha_actualizacion: Date;

  @OneToMany(() => PropietarioNicho, (propietarioNicho) => propietarioNicho.id_persona)
  propietarios_nichos: PropietarioNicho[];

  @OneToMany(() => Inhumacion, (inhumacion) => inhumacion.id_fallecido)
  inhumaciones: Inhumacion[];
  
  @OneToMany(() => RequisitosInhumacion, (requisitosInhumacion) => requisitosInhumacion.id_fallecido)
  requisitos_inhumacion: RequisitosInhumacion[];

  @OneToMany(() => RequisitosInhumacion, (requisitosInhumacion) => requisitosInhumacion.id_solicitante)
  requisitos_inhumacion_solicitante: RequisitosInhumacion[];

  @OneToMany(() => HuecosNicho, (huecosNicho) => huecosNicho.id_fallecido)
  huecos_nichos: HuecosNicho[];

  @BeforeInsert()
  async setFechaCreacion() {
    this.fecha_creacion = new Date();
  }
  @BeforeUpdate()
  async setFechaActualizacion() {
    this.fecha_actualizacion = new Date();
  }
}
