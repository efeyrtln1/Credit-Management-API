import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Credit } from './entities/credit.entity';
import { PaymentPlan } from './entities/payment-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Credit, PaymentPlan])],
  exports: [TypeOrmModule],
})
export class CreditsModule {}