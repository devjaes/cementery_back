import { Cementerio } from 'src/cementerio/entities/cementerio.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Entity('User')
export class User {

    @PrimaryGeneratedColumn('uuid')
    id_user: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    cedula: string;

    @Column({ type: 'varchar', length: 100 })
    email: string;

    @Column({ type: 'varchar', length: 100 })
    nombre: string;

    @Column({ type: 'varchar', length: 100 })
    apellido: string;

    @Column({ type: 'varchar', length: 100 })
    password: string;

    @Column({ type: 'varchar', length: 100 })
    rol: string;

    @Column({ type: 'varchar', length: 100 })
    fecha_creacion: string;

    @Column({ type: 'varchar', length: 100 , nullable: true })
    fecha_modificacion: string;

    @Column({ type: 'varchar', length: 100 })
    estado: string;

    @BeforeInsert()
    fechaCreacion() {
        this.fecha_creacion = new Date().toISOString();
    }

    @BeforeInsert()
    estadoActivo() {
        this.estado = 'Activo';
    }

    @BeforeInsert()
    async hashPassword() {
        const salteRounds = 10;
        this.password = await bcrypt.hash(this.password, salteRounds);
    }

    @BeforeUpdate()
    fechaActualizacion() {
        this.fecha_modificacion = new Date().toISOString();
    }
    
}
