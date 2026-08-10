import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { PaymentPlan } from '../credits/entities/payment-plan.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentPlan]), NotificationsModule],
  providers: [TasksService],
})
export class TasksModule {}
