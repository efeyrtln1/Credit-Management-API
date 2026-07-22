import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Credit } from './credit.entity';
import { Payment } from '../../payments/entities/payment.entity';

export enum PaymentPlanStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  LATE = 'LATE',
}

@Entity('payment_plans')
export class PaymentPlan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  creditId!: string;

  @ManyToOne(() => Credit, (credit: Credit) => credit.paymentPlans)
  @JoinColumn({ name: 'creditId' })
  credit!: Credit;

  @Column('int')
  installmentNo!: number;

  @Column('decimal', { precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'date' })
  dueDate!: string;

  @Column({
    type: 'enum',
    enum: PaymentPlanStatus,
    default: PaymentPlanStatus.UNPAID,
  })
  status!: PaymentPlanStatus;

  @Column('decimal', { precision: 5, scale: 4 })
  lateFeeRate!: number;

  @Column('int', { default: 0 })
  snoozeCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  paidAt!: Date | null;

  @OneToMany(() => Payment, (payment: Payment) => payment.paymentPlan)
  payments!: Payment[];
}