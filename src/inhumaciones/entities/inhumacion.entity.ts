import { IsOptional } from 'class-validator';
import { Exumacion } from 'src/exumacion/entities/exumacion.entity';
import { Nicho } from 'src/nicho/entities/nicho.entity';
import { Persona } from 'src/personas/entities/persona.entity';
import { RequisitosInhumacion } from 'src/requisitos-inhumacion/entities/requisitos-inhumacion.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';

@Entity('inhumaciones')
export class Inhumacion {
  @PrimaryGeneratedColumn('uuid')
  id_inhumacion: string;

  @ManyToOne(() => Nicho, (nicho) => nicho.inhumaciones, { eager: true })
  @JoinColumn({ name: 'id_nicho' })
  id_nicho: Nicho;

  @ManyToOne(() => Persona, (persona) => persona.inhumaciones, { eager: true })
  @JoinColumn({ name: 'id_fallecido' })
  id_fallecido: Persona;

  @Column('date')
  fecha_inhumacion: Date;

  @Column('time')
  hora_inhumacion: string;

  @Column()
  solicitante: string;

  @Column()
  responsable_inhumacion: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column()
  estado: string;

  @Column()
  codigo_inhumacion: string;

  @Column({ type: 'json', nullable: true })
  documentos: {
    solicitud_firmada?: string;
    cedula_solicitante?: string;
    certificado_defuncion_civil?: string;
    certificado_defuncion_medico?: string;
    titulo_propiedad?: string;
    comprobante_pago?: string;
    autorizacion_movilizacion?: string;
  };

  @OneToOne(() => RequisitosInhumacion, (requisitos) => requisitos.inhumacion, { nullable: true })
  @JoinColumn({ name: 'id_requisitos_inhumacion' })
  id_requisitos_inhumacion: RequisitosInhumacion;

  @Column('date')
  fecha_creacion: string;

  @Column('date', { nullable: true })
  fecha_actualizacion: string;

  @OneToMany(() => Exumacion, (exumacion) => exumacion.id_inhumacion)
  exumaciones: Exumacion[];

  @BeforeInsert()
  async setFechaCreacion() {
    this.fecha_creacion = new Date().toISOString().split('T')[0];
  }

  @BeforeInsert()
  estadoDefault() {
    if (!this.estado) {
      this.estado = 'Pendiente';
    }
  }

  @BeforeUpdate()
  async setFechaActualizacion() {
    this.fecha_actualizacion = new Date().toISOString().split('T')[0];
  }
}
