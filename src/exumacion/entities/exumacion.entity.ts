import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Nicho } from 'src/nicho/entities/nicho.entity';
import { Inhumacion } from 'src/inhumaciones/entities/inhumacion.entity';

@Entity()
export class Exumacion {
  @PrimaryGeneratedColumn('uuid')
  id_exhumacion: string;

  @ManyToOne(() => Inhumacion, (inhumacion) => inhumacion.exumaciones, { eager: true })
  @JoinColumn({ name: 'id_inhumacion' })
  id_inhumacion: Inhumacion;

  @Column({ unique: true })
  codigo: string; // Ej: 002-2025-CMC-EXH

  @Column({ type: 'enum', enum: ['escrito', 'verbal'] })
  metodoSolicitud: string;

  // Relación con solicitante
  @Column()
  solicitante: string;

  @Column()
  parentesco: string;

  // Relación con fallecido
  @Column()
  fallecido: string;

  // Relación con nicho original
  @ManyToOne(() => Nicho, (nicho) => nicho.exumaciones, { eager: true })
  @JoinColumn({ name: 'id_nicho' })
  nichoOriginal: Nicho;

  // Datos de nueva sepultura
  @Column({ nullable: true })
  nuevoLugar?: string;

  @Column({ type: 'date' })
  fechaExhumacion: Date;

  @Column({ type: 'time' })
  horaExhumacion: string;

  @Column({ default: false })
  aprobado: boolean;

  @Column({ nullable: true })
  aprobadoPor?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fechaSolicitud: Date;
}