// src/nichos/entities/nicho.entity.ts
import { Cementerio } from 'src/cementerio/entities/cementerio.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Exumacion } from 'src/exumacion/entities/exumacion.entity';
import { Inhumacion } from 'src/inhumaciones/entities/inhumacion.entity';
import { PropietarioNicho } from 'src/propietarios-nichos/entities/propietarios-nicho.entity';
import { HuecosNicho } from 'src/huecos-nichos/entities/huecos-nicho.entity';

@Entity('nichos')
export class Nicho {
  @PrimaryGeneratedColumn('uuid')
  id_nicho: string;

  @ManyToOne(() => Cementerio, (cementerio) => cementerio.nichos, { eager: true })
  @JoinColumn({ name: 'id_cementerio' })
  id_cementerio: Cementerio;

  @Column({ length: 50 })
  sector: string;

  @Column({ length: 10 })
  fila: string;

  @Column({ length: 10 })
  numero: string;

  @Column({ length: 20 })
  tipo: string;

  @Column({ length: 20 })
  estado: string;

  @Column({ type: 'int', name: 'num_huecos' })
  num_huecos: number;

  @Column({ type: 'varchar', name: 'fecha_construccion'})
  fecha_construccion: string;

  // @Column({ type: 'date', nullable: true })
  // fecha_adquisicion?: Date


  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @CreateDateColumn({ type: 'varchar' })
  fecha_creacion: string;

  @UpdateDateColumn({ type: 'varchar', nullable: true })
  fecha_actualizacion: string;

  @OneToMany(() => Exumacion, (exumacion) => exumacion.nichoOriginal)
  exumaciones: Exumacion[];

  @OneToMany(() => Inhumacion, (inhumacion) => inhumacion.id_nicho)
  inhumaciones: Inhumacion[];

  @OneToMany(() => PropietarioNicho, (propietarioNicho) => propietarioNicho.id_nicho)
  propietarios_nicho: PropietarioNicho[];

  @OneToMany(() => HuecosNicho, (hueco) => hueco.id_nicho)
  huecos: HuecosNicho[];

  @BeforeInsert()
  async setFechaCreacion() {
    this.fecha_creacion = new Date().toISOString();
  }

  @BeforeInsert()
  async estadoDefault() {
    this.estado = 'Activo';
  }

  @BeforeUpdate()
  async setFechaActualizacion() {
    this.fecha_actualizacion = new Date().toISOString();
  }

}