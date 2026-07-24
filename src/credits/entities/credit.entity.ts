import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PaymentPlan } from './payment-plan.entity';

export enum CreditStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('credits')
export class Credit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User, (user: User) => user.credits)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column('decimal', { precision: 12, scale: 2 })
  amount!: number;

  @Column('int')
  termCount!: number;

  @Column('decimal', { precision: 5, scale: 4 })
  interestRate!: number;

  @Column('decimal', { precision: 12, scale: 2 })
  totalPayable!: number;

  @Column({
    type: 'enum',
    enum: CreditStatus,
    default: CreditStatus.ACTIVE,
  })
  status!: CreditStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => PaymentPlan, (plan: PaymentPlan) => plan.credit, {
    cascade: true,
  })
  paymentPlans!: PaymentPlan[];
}
