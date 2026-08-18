import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentPlan } from './payment-plan.entity';

export enum PaymentChannel {
  MANUAL = 'MANUAL',
  AUTO = 'AUTO',
}

export enum PaymentStatus {
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

export enum PaymentType {
  FULL = 'FULL',
  SNOOZE = 'SNOOZE',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  paymentPlanId!: string;

  @ManyToOne(() => PaymentPlan, (paymentPlan) => paymentPlan.payments, {
    onDelete: 'CASCADE',
  })
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
    enum: PaymentType,
    default: PaymentType.FULL,
  })
  type!: PaymentType;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.SUCCEEDED,
  })
  status!: PaymentStatus;

  @Column({ unique: true })
  idempotencyKey!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
