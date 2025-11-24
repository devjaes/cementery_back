// src/nichos/entities/nicho.entity.ts
import { Cementerio } from 'src/cementerio/entities/cementerio.entity';
import { Bloque } from 'src/bloques/entities/bloque.entity';
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
} from 'typeorm';
import { Exhumacion } from 'src/exhumacion/entities/exhumacion.entity';
import { Mejora } from 'src/mejoras/entities/mejora.entity';
import { Inhumacion } from 'src/inhumaciones/entities/inhumacion.entity';
import { PropietarioNicho } from 'src/propietarios-nichos/entities/propietarios-nicho.entity';
import { HuecosNicho } from 'src/huecos-nichos/entities/huecos-nicho.entity';
import { EstadoNicho } from '../enum/estadoNicho.enum';

@Entity('nichos')
export class Nicho {
  @PrimaryGeneratedColumn('uuid')
  id_nicho: string;

  @ManyToOne(() => Cementerio, (cementerio) => cementerio.nichos, {
    eager: true,
  })
  @JoinColumn({ name: 'id_cementerio' })
  id_cementerio: Cementerio;

  @ManyToOne(() => Bloque, (bloque) => bloque.nichos, {
    nullable: true,
  })
  @JoinColumn({ name: 'id_bloque' })
  id_bloque: Bloque;

  @Column({ type: 'int', nullable: true })
  fila: number;

  @Column({ type: 'int', nullable: true })
  columna: number;

  @Column({ length: 20, nullable: true })
  tipo: string;

  @Column({ length: 20 })
  estado: string;

  @Column({
    type: 'enum',
    enum: EstadoNicho,
    default: EstadoNicho.DESHABILITADO,
  })
  estadoVenta: EstadoNicho;

  @Column({ type: 'int', name: 'num_huecos', nullable: true })
  num_huecos: number;

  @Column({ type: 'varchar', name: 'fecha_construccion', nullable:true })
  fecha_construccion: string;

  // @Column({ type: 'date', nullable: true })
  // fecha_adquisicion?: Date

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @CreateDateColumn({ type: 'varchar' })
  fecha_creacion: string;

  @UpdateDateColumn({ type: 'varchar', nullable: true })
  fecha_actualizacion: string;

  @OneToMany(
    () => Exhumacion,
    (exhumacion: Exhumacion) => exhumacion.nichoOriginal,
  )
  exhumaciones: Exhumacion[];

  @OneToMany(() => Mejora, (mejora) => mejora.nicho)
  mejoras: Mejora[];

  @OneToMany(() => Inhumacion, (inhumacion) => inhumacion.id_nicho)
  inhumaciones: Inhumacion[];

  @OneToMany(
    () => PropietarioNicho,
    (propietarioNicho) => propietarioNicho.id_nicho,
  )
  propietarios_nicho: PropietarioNicho[];

  @OneToMany(() => HuecosNicho, (hueco) => hueco.id_nicho)
  huecos: HuecosNicho[];
  static estadoVenta: any;
  static observaciones: any;

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
