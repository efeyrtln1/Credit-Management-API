import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';
import { Credit } from './entities/credit.entity';
import { PaymentPlan } from './entities/payment-plan.entity';
import { Payment } from './entities/payment.entity';
import { UsersModule } from '../users/users.module';
import { RedisModule } from '../common/redis/redis.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Credit, PaymentPlan, Payment]),
    UsersModule,
    RedisModule,
    NotificationsModule,
  ],
  controllers: [CreditsController],
  providers: [CreditsService],
  exports: [CreditsService],
})
export class CreditsModule {}
