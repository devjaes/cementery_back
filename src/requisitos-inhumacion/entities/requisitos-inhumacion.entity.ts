import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { HuecosNicho } from 'src/huecos-nichos/entities/huecos-nicho.entity';
import { Persona } from 'src/personas/entities/persona.entity';
import { Cementerio } from 'src/cementerio/entities/cementerio.entity';
import { Inhumacion } from 'src/inhumaciones/entities/inhumacion.entity';

@Entity()
export class RequisitosInhumacion {
  @PrimaryGeneratedColumn('uuid')
  id_requsitoInhumacion: string;

  // A) Datos institucionales
  @ManyToOne(() => Cementerio, (cementerio) => cementerio.requisitos_inhumacion, { eager: true })
  @JoinColumn({ name: 'id_cementerio' })
  id_cementerio: Cementerio;

  @Column()
  pantoneroACargo: string;

  // B) Método de solicitud
  @Column({ default: 'Escrita' })
  metodoSolicitud: string;

  // C) Datos del solicitante
  @ManyToOne(() => Persona, (persona) => persona.requisitos_inhumacion_solicitante, { eager: true })
  @JoinColumn({ name: 'id_solicitante' })
  id_solicitante: Persona;

  @Column({ nullable: true })
  observacionSolicitante: string;

  // D) Checklist de requisitos
  @Column({ default: false })
  copiaCertificadoDefuncion: boolean;

  @Column ( {nullable: true})
  observacionCertificadoDefuncion: string;

  @Column({ default: false })
  informeEstadisticoINEC: boolean;

  @Column ( {nullable: true })
  observacionInformeEstadisticoINEC: string;

  @Column({ default: false })
  copiaCedula: boolean;

  @Column ( {nullable: true })
  observacionCopiaCedula: string;

  @Column({ default: false })
  pagoTasaInhumacion: boolean;

  @Column ( {nullable: true })
  observacionPagoTasaInhumacion: string;

  @Column({ default: false })
  copiaTituloPropiedadNicho: boolean;

  @Column ( {nullable: true })
  observacionCopiaTituloPropiedadNicho: string;

  @Column({ default: false })
  autorizacionDeMovilizacionDelCadaver: boolean;

  @Column ( {nullable: true })
  observacionAutorizacionMovilizacion: string;

  @Column({ default: false })
  OficioDeSolicitud: boolean;

  @Column ( {nullable: true })
  observacionOficioSolicitud: string;

  // E) Datos del nicho/fosa/sillio
  @ManyToOne(() => HuecosNicho, (huecosNicho) => huecosNicho.requisitos_inhumacion, { eager: true })
  @JoinColumn({ name: 'id_hueco_nicho' })
  id_hueco_nicho: HuecosNicho;

  // F) Datos del fallecido
  @ManyToOne(() => Persona, (persona) => persona.requisitos_inhumacion, { eager: true })
  @JoinColumn({ name: 'id_fallecido' })
  id_fallecido: Persona;
  
  @OneToOne(() => Inhumacion, (inhumacion) => inhumacion.id_requisitos_inhumacion, { eager: true })
  inhumacion: Inhumacion;

  @Column()
  fechaInhumacion: Date;

  @Column()
  horaInhumacion: string;

  @Column({ type: 'varchar', length: 100 })
  nombreAdministradorNicho: string; 
}
