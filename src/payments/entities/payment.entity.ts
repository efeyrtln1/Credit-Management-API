import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentPlan } from '../../credits/entities/payment-plan.entity';

export enum PaymentChannel {
  MANUAL = 'MANUAL',
  AUTO = 'AUTO',
}

export enum PaymentStatus {
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  paymentPlanId!: string;

  @ManyToOne(() => PaymentPlan, (plan) => plan.payments)
  @JoinColumn({ name: 'paymentPlanId' })
  paymentPlan!: PaymentPlan;

  @Column('decimal', { precision: 12, scale: 2 })
  amount!: number;

  @Column({
    type: 'enum',
    enum: PaymentChannel,
    default: PaymentChannel.MANUAL,
  })
  channel!: PaymentChannel;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
  })
  status!: PaymentStatus;

  @CreateDateColumn()
  createdAt!: Date;
}