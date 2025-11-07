import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Nicho } from 'src/nicho/entities/nicho.entity';
import { Inhumacion } from 'src/inhumaciones/entities/inhumacion.entity';

export enum EstadoExhumacion {
  PENDIENTE = 'pendiente',
  FINALIZADO = 'finalizado',
}

@Entity('exhumaciones')
export class Exhumacion {
  @PrimaryGeneratedColumn('uuid')
  id_exhumacion: string;

  @Column({ type: 'date' })
  fecha_exhumacion: Date;

  @Column()
  hora_exhumacion: string;

  @Column()
  duenio_nicho: string;

  @Column()
  ubicacion: string;

  @Column()
  causa: string;

  @Column({ nullable: true })
  observacion?: string;

  @Column({ type: 'bytea', nullable: true })
  archivos?: Buffer | null;

  @Column({
    type: 'enum',
    enum: EstadoExhumacion,
    default: EstadoExhumacion.PENDIENTE,
  })
  estado_pago: EstadoExhumacion;

  @Column({ type: 'bytea', nullable: true })
  comprobante_pago?: Buffer; // ← binario también

  @Column({ nullable: true })
  codigo?: string;

  @ManyToOne(() => Nicho)
  @JoinColumn({ name: 'nicho_original_id' })
  nichoOriginal: Nicho;

  @Column()
  nicho_original_id: string;

  @ManyToOne(() => Inhumacion, (inhumacion) => inhumacion.exhumaciones)
  @JoinColumn({ name: 'inhumacion_id' })
  inhumacion: Inhumacion;

  @Column()
  inhumacion_id: string;
}
