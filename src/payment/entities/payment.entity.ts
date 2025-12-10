import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  paymentId: string;

  @Column({
    type: 'enum',
    enum: [
      'burial',
      'exhumation',
      'niche_sale',
      'tomb_improvement',
      'hole_extension',
    ],
    nullable: false,
  })
  procedureType:
    | 'burial'
    | 'exhumation'
    | 'niche_sale'
    | 'tomb_improvement'
    | 'hole_extension';

  @Column({ type: 'uuid', nullable: false })
  procedureId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  amount: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'paid'],
    default: 'pending',
  })
  status: 'pending' | 'paid';

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  paymentCode: string;

  @CreateDateColumn({ type: 'timestamp' })
  generatedDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidDate: Date;

  @Column({ type: 'text', nullable: true })
  receiptFile: string;

  @Column({ type: 'text', nullable: true })
  observations: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  generatedBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  validatedBy: string;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: false,
    default: '0000000000',
  })
  buyerDocument: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    default: 'Sin nombre',
  })
  buyerName: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    default: 'Sin dirección',
  })
  buyerDirection: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  deceasedName: string;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedDate: Date;
}
