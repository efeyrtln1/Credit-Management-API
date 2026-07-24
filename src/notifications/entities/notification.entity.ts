import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum NotificationType {
  CREDIT_APPROVED = 'CREDIT_APPROVED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  REMINDER = 'REMINDER',
  OVERDUE = 'OVERDUE',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type!: NotificationType;

  @Column('jsonb')
  payload!: Record<string, any>;

  @CreateDateColumn()
  sentAt!: Date;
}
