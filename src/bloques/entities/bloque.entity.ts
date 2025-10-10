import { Cementerio } from 'src/cementerio/entities/cementerio.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Nicho } from 'src/nicho/entities/nicho.entity';

@Entity('bloques')
export class Bloque {
  @PrimaryGeneratedColumn('uuid')
  id_bloque: string;

  @ManyToOne(() => Cementerio, (cementerio) => cementerio.bloques, {
    eager: true,
  })
  @JoinColumn({ name: 'id_cementerio' })
  id_cementerio: Cementerio;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  descripcion: string;

  @Column({ type: 'int' })
  numero_filas: number;

  @Column({ type: 'int' })
  numero_columnas: number;

  @Column({ type: 'varchar', length: 20, default: 'Activo' })
  estado: string;

  @Column({ type: 'varchar', length: 100 })
  fecha_creacion: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  fecha_modificacion: string;

  @OneToMany(() => Nicho, (nicho) => nicho.id_bloque)
  nichos: Nicho[];

  @BeforeInsert()
  async fechaCreacion() {
    this.fecha_creacion = new Date().toISOString();
    this.estado = 'Activo';
  }

  @BeforeUpdate()
  async beforeUpdate() {
    this.fecha_modificacion = new Date().toISOString();
  }
}