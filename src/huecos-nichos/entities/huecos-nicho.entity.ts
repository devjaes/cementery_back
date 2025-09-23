// src/huecos-nichos/entities/huecos-nicho.entity.ts
import { Nicho } from 'src/nicho/entities/nicho.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Persona } from 'src/personas/entities/persona.entity';
import { RequisitosInhumacion } from 'src/requisitos-inhumacion/entities/requisitos-inhumacion.entity';

@Entity('huecos_nichos')
export class HuecosNicho{
  @PrimaryGeneratedColumn('uuid')
  id_detalle_hueco: string;

  @ManyToOne(() => Nicho, (nicho) => nicho.huecos, { eager: true })
  @JoinColumn({ name: 'id_nicho' })
  id_nicho: Nicho;

  @Column({ type: 'int', name: 'num_hueco' })
  num_hueco: number;

  @Column({ length: 20 })
  estado: string;

  @ManyToOne(() => Persona, (persona) => persona.huecos_nichos, { nullable: true, eager: true })
  @JoinColumn({ name: 'id_persona' })
  id_fallecido: Persona;

  @OneToMany(() => RequisitosInhumacion, (requisito) => requisito.id_hueco_nicho)
  requisitos_inhumacion: RequisitosInhumacion[];
  
  @CreateDateColumn({ type: 'date' })
  fecha_creacion: Date;

  @UpdateDateColumn({ type: 'date', nullable: true })
  fecha_actualizacion: Date;

  @BeforeInsert()
  async setFechaCreacion() {
    this.fecha_creacion = new Date();
  }

  @BeforeInsert()
  async estadoDefault() {
    this.estado = 'Disponible'; // Estado por defecto al crear un nuevo hueco
  }

  @BeforeUpdate()
  async setFechaActualizacion() {
    this.fecha_actualizacion = new Date();
  }

}