import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { CreditLimit } from './credit-limit.entity';
import { Credit } from '../../credits/entities/credit.entity';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  name!: string;

  @Column()
  phone!: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToOne(() => CreditLimit, (limit: CreditLimit) => limit.user, { cascade: true })
  creditLimit!: CreditLimit;

  @OneToMany(() => Credit, (credit: Credit) => credit.user)
  credits!: Credit[];
}