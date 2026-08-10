import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Equal } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  PaymentPlan,
  PaymentPlanStatus,
} from '../credits/entities/payment-plan.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(PaymentPlan)
    private readonly paymentPlanRepository: Repository<PaymentPlan>,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  // 1. Late-Check Cron Job (Her gün 00:01)
  @Cron('1 0 * * *')
  async handleLateCheck() {
    this.logger.log('Running Daily Late-Check Job...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overduePlans = await this.paymentPlanRepository.find({
      where: {
        dueDate: LessThan(today as any),
        status: PaymentPlanStatus.UNPAID,
      },
      relations: { credit: true },
    });

    for (const plan of overduePlans) {
      plan.status = PaymentPlanStatus.LATE;
      await this.paymentPlanRepository.save(plan);

      await this.notificationsService.createNotification(
        plan.credit.userId,
        NotificationType.OVERDUE,
        {
          paymentPlanId: plan.id,
          creditId: plan.creditId,
          dueDate: plan.dueDate,
          amount: plan.amount,
        },
      );

      this.logger.warn(`Payment plan ${plan.id} marked as LATE.`);
    }
  }

  // 2. Reminder Cron Job (Her gün 09:00)
  @Cron('0 9 * * *')
  async handleReminders() {
    this.logger.log('Running Daily Reminder Job...');

    const reminderDays = Number(
      this.configService.get<number>('REMINDER_DAYS_BEFORE_DUE', 3),
    );
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + reminderDays);
    targetDate.setHours(0, 0, 0, 0);

    const upcomingPlans = await this.paymentPlanRepository.find({
      where: {
        dueDate: Equal(targetDate as any),
        status: PaymentPlanStatus.UNPAID,
      },
      relations: { credit: true },
    });

    for (const plan of upcomingPlans) {
      await this.notificationsService.createNotification(
        plan.credit.userId,
        NotificationType.REMINDER,
        {
          paymentPlanId: plan.id,
          creditId: plan.creditId,
          dueDate: plan.dueDate,
          amount: plan.amount,
          daysLeft: reminderDays,
        },
      );

      this.logger.log(`Reminder sent for payment plan ${plan.id}.`);
    }
  }
}
