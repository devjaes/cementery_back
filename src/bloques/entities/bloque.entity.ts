import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BeforeInsert, OneToMany } from 'typeorm';
import { Cementerio } from 'src/cementerio/entities/cementerio.entity';
import { Nicho } from 'src/nicho/entities/nicho.entity';

@Entity('Bloque')
export class Bloque {
  @PrimaryGeneratedColumn('uuid')
  id_bloque: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion?: string;

  @Column({ type: 'int', nullable: true })
  numero: number;

  @Column({ type: 'int' })
  numero_filas: number;

  @Column({ type: 'int' })
  numero_columnas: number;

  @Column({ type: 'varchar', length: 50, default: 'Activo' })
  estado: string;

  @Column({ type: 'varchar', length: 50, default: 'Bloque' })
  tipo_bloque: string; // 'Bloque' o 'Mausoleo'

  @Column({ type: 'varchar', length: 100, nullable: true })
  fecha_creacion?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  fecha_modificacion?: string;

  // Clave foránea explícita
  @Column({ type: 'uuid' })
  id_cementerio: string;

  // Relación con Cementerio
  @ManyToOne(() => Cementerio, (cementerio) => cementerio.bloques, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_cementerio' })
  cementerio: Cementerio;

  // Relación con Nichos
  @OneToMany(() => Nicho, (nicho) => nicho.id_bloque)
  nichos: Nicho[];

  @BeforeInsert()
  async beforeInsert() {
    this.estado = this.estado || 'Activo';
    this.fecha_creacion = this.fecha_creacion || new Date().toISOString();
  }
}

