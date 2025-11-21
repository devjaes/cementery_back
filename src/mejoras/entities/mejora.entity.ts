import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Nicho } from 'src/nicho/entities/nicho.entity';
import { Persona } from 'src/personas/entities/persona.entity';
import { User } from 'src/user/entities/user.entity';
import { MetodoSolicitudMejora } from '../enum/metodo-solicitud.enum';

@Entity('mejoras')
export class Mejora {
  @PrimaryGeneratedColumn('uuid')
  id_mejora: string;

  @Column({ unique: true })
  codigo: string;

  @Column({ type: 'enum', enum: MetodoSolicitudMejora })
  metodoSolicitud: MetodoSolicitudMejora;

  @Column({ type: 'varchar', length: 150, nullable: true })
  codigoAutorizacion?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  entidad?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  direccionEntidad?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  panteoneroACargo?: string;

  @ManyToOne(() => Nicho, (nicho) => nicho.mejoras, { eager: true })
  @JoinColumn({ name: 'id_nicho' })
  nicho: Nicho;

  @ManyToOne(() => Persona, (persona) => persona.mejorasSolicitadas, {
    eager: true,
  })
  @JoinColumn({ name: 'id_solicitante' })
  solicitante: Persona;

  @ManyToOne(() => Persona, (persona) => persona.mejorasFallecido, {
    nullable: true,
    eager: true,
  })
  @JoinColumn({ name: 'id_fallecido' })
  fallecido?: Persona;

  @Column({ type: 'varchar', length: 200, nullable: true })
  solicitanteDireccion?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  solicitanteCorreo?: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  solicitanteTelefono?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  observacionSolicitante?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  propietarioNombre?: string;

  @Column({ type: 'date', nullable: true })
  propietarioFechaAdquisicion?: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  propietarioTipoTenencia?: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  administradorNicho?: string;

  @Column({ type: 'varchar', length: 120 })
  tipoServicio: string;

  @Column({ type: 'text', nullable: true })
  observacionServicio?: string;

  @Column({ type: 'date' })
  fechaInicio: Date;

  @Column({ type: 'date' })
  fechaFin: Date;

  @Column({ type: 'varchar', length: 120, nullable: true })
  horarioTrabajo?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  condicion?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  autorizacionTexto?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  normativaAplicable?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  obligacionesPostObra?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  escombreraMunicipal?: string;

  @Column({ default: false })
  aprobado: boolean;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'aprobado_por' })
  aprobadoPor?: User;

  @Column({ type: 'timestamp', nullable: true })
  fechaAprobacion?: Date;

  @Column({ type: 'varchar', length: 40, default: 'Solicitado' })
  estado: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion', nullable: true })
  fechaActualizacion?: Date;
}
