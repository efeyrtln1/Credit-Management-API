import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum ScoreGroup {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
}

@Entity('credit_limits')
export class CreditLimit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @OneToOne(() => User, (user) => user.creditLimit)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({
    type: 'enum',
    enum: ScoreGroup,
  })
  scoreGroup!: ScoreGroup;

  @Column('decimal', { precision: 12, scale: 2 })
  baseLimit!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  usedAmount!: number;

  @Column('decimal', { precision: 12, scale: 2 })
  availableLimit!: number;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;
}
