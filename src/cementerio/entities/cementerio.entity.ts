import { Nicho } from "src/nicho/entities/nicho.entity";
import { RequisitosInhumacion } from "src/requisitos-inhumacion/entities/requisitos-inhumacion.entity";
import { User } from "src/user/entities/user.entity";
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('Cementerio')
export class Cementerio {
    @PrimaryGeneratedColumn('uuid')
    id_cementerio: string;

    @Column({ type: 'varchar', length: 100 })
    nombre: string;

    @Column({ type: 'varchar', length: 100 })
    direccion: string;

    @Column({ type: 'varchar', length: 100 })
    telefono: string;

    @Column({ type: 'varchar', length: 100 })
    responsable: string;

    @Column({ type: 'varchar', length: 100 })
    estado: string;

    @Column({ type: 'varchar', length: 100 })
    fecha_creacion: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    fecha_modificacion: string;

    @OneToMany(() => Nicho, (nicho) => nicho.id_cementerio)
    nichos: Nicho[];

    @OneToMany(() => RequisitosInhumacion, (requisito) => requisito.id_cementerio)
    requisitos_inhumacion: RequisitosInhumacion[];

    @BeforeInsert()
    async FechaCreacion() {
        this.fecha_creacion = new Date().toISOString();
        this.estado = 'Activo';
    }

    @BeforeUpdate()
    async beforeUpdate() {
        this.fecha_modificacion = new Date().toISOString();
    }
    
}
