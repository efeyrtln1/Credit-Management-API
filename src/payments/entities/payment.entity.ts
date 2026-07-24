import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentPlan } from '../../credits/entities/payment-plan.entity';

export enum PaymentType {
  FULL = 'FULL',
  SNOOZE = 'SNOOZE',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  paymentPlanId!: string;

  @ManyToOne(() => PaymentPlan, (plan: PaymentPlan) => plan.payments)
  @JoinColumn({ name: 'paymentPlanId' })
  paymentPlan!: PaymentPlan;

  @Column('decimal', { precision: 12, scale: 2 })
  amount!: number;

  @Column({
    type: 'enum',
    enum: PaymentType,
  })
  type!: PaymentType;

  @Column({ unique: true })
  idempotencyKey!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
