import { Nicho } from 'src/nicho/entities/nicho.entity';
import { Persona } from 'src/personas/entities/persona.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, BeforeInsert, BeforeUpdate, JoinColumn } from 'typeorm';

@Entity('propietarios_nichos')
export class PropietarioNicho {
  @PrimaryGeneratedColumn('uuid')
  id_propietario_nicho: string;

  @ManyToOne(() => Persona, (persona) => persona.propietarios_nichos, { eager: true })
  @JoinColumn({ name: 'id_persona' })
  id_persona: Persona;

  @ManyToOne(() => Nicho, (nicho) => nicho.propietarios_nicho, { eager: true })
  @JoinColumn({ name: 'id_nicho' })
  id_nicho: Nicho;

  @Column({ type: 'date' }) fecha_adquisicion: Date;
  @Column({ type: 'varchar', length: 100 }) tipo_documento: string;
  @Column({ type: 'varchar', length: 100 }) numero_documento: string;
  @Column({ type: 'boolean', default: true}) activo: boolean;
  @Column({ type: 'varchar', length: 255 }) razon: string;
  @Column({ type: 'timestamp' }) fecha_creacion: Date;
  @Column({ type: 'timestamp', nullable: true }) fecha_actualizacion: Date;
  @Column({ 
    type: 'varchar', 
    length: 50, 
    default: 'Dueño' 
  })
  tipo: string; // Puede ser 'Dueño' o 'Heredero'

  @BeforeInsert()
  async setFechaCreacion() {
    this.fecha_creacion = new Date();
  }

  @BeforeUpdate()
  async setFechaActualizacion() {
    this.fecha_actualizacion = new Date();
  }
}
