import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
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

  @Column({ nullable: true })
  phone!: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToOne(() => CreditLimit, (creditLimit) => creditLimit.user)
  creditLimit!: CreditLimit;

  // 🔽 Credit ilişkisi eklenerek credit.entity.ts tarafındaki Linter uyarısı çözüldü
  @OneToMany(() => Credit, (credit) => credit.user)
  credits!: Credit[];
}
