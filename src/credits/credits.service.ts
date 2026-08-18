import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsRelations } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Credit, CreditStatus } from './entities/credit.entity';
import { PaymentPlan, PaymentPlanStatus } from './entities/payment-plan.entity';
import {
  Payment,
  PaymentChannel,
  PaymentStatus,
  PaymentType,
} from './entities/payment.entity';
import { CreditLimit } from '../users/entities/credit-limit.entity';
import { UsersService } from '../users/users.service';
import { ApplyCreditDto } from './dto/apply-credit.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(Credit)
    private readonly creditRepository: Repository<Credit>,
    @InjectRepository(PaymentPlan)
    private readonly paymentPlanRepository: Repository<PaymentPlan>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
    private readonly configService?: ConfigService,
  ) {}

  async applyForCredit(userId: string, applyCreditDto: ApplyCreditDto) {
    const { amount, termCount } = applyCreditDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const creditLimit = await queryRunner.manager.findOne(CreditLimit, {
        where: { userId },
      });

      if (!creditLimit) {
        throw new NotFoundException('Kullanıcıya ait kredi limiti bulunamadı.');
      }

      if (Number(creditLimit.availableLimit) < amount) {
        throw new BadRequestException(
          'Kullanılabilir kredi limitiniz bu başvuru için yetersizdir.',
        );
      }

      const interestRates: Record<string, number> = {
        A: 0.015,
        B: 0.02,
        C: 0.025,
        D: 0.03,
      };
      const lateFeeRates: Record<string, number> = {
        A: 0.0005,
        B: 0.0008,
        C: 0.001,
        D: 0.0015,
      };

      const userGroup = creditLimit.scoreGroup || 'D';
      const monthlyInterestRate = interestRates[userGroup] ?? 0.03;
      const dailyLateFeeRate = lateFeeRates[userGroup] ?? 0.0015;

      const totalPayable = amount * (1 + monthlyInterestRate * termCount);
      const monthlyInstallment = Number((totalPayable / termCount).toFixed(2));

      const credit = this.creditRepository.create({
        userId,
        amount,
        termCount,
        interestRate: monthlyInterestRate,
        totalPayable: Number(totalPayable.toFixed(2)),
        status: CreditStatus.ACTIVE,
      });

      const savedCredit = await queryRunner.manager.save(Credit, credit);

      const paymentPlans: PaymentPlan[] = [];
      const now = new Date();

      for (let i = 1; i <= termCount; i++) {
        const dueDateObj = new Date(now);
        dueDateObj.setMonth(dueDateObj.getMonth() + i);

        const plan = this.paymentPlanRepository.create({
          creditId: savedCredit.id,
          installmentNo: i,
          amount: monthlyInstallment,
          dueDate: dueDateObj.toISOString().split('T')[0],
          status: PaymentPlanStatus.UNPAID,
          lateFeeRate: dailyLateFeeRate,
          snoozeCount: 0,
        });

        paymentPlans.push(plan);
      }

      await queryRunner.manager.save(PaymentPlan, paymentPlans);

      creditLimit.availableLimit = Number(creditLimit.availableLimit) - amount;
      creditLimit.usedAmount = Number(creditLimit.usedAmount) + amount;
      await queryRunner.manager.save(CreditLimit, creditLimit);

      await queryRunner.commitTransaction();

      await this.notificationsService.createNotification(
        userId,
        NotificationType.CREDIT_APPROVED,
        {
          creditId: savedCredit.id,
          amount,
          totalPayable: Number(totalPayable.toFixed(2)),
        },
      );

      return {
        message:
          'Kredi başvurunuz başarıyla onaylandı ve taksit planı oluşturuldu.',
        credit: savedCredit,
        paymentPlansSummary: {
          totalPayable: Number(totalPayable.toFixed(2)),
          monthlyInstallment,
          termCount,
        },
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getMyCredits(userId: string): Promise<Credit[]> {
    return this.creditRepository.find({
      where: { userId },
      relations: {
        paymentPlans: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getCreditById(userId: string, creditId: string): Promise<Credit> {
    const credit = await this.creditRepository.findOne({
      where: { id: creditId, userId },
      relations: { paymentPlans: true },
    });

    if (!credit) {
      throw new NotFoundException('Kredi bulunamadı.');
    }

    return credit;
  }

  async getPaymentPlansByCreditId(userId: string, creditId: string) {
    await this.getCreditById(userId, creditId);

    const paymentPlans = await this.paymentPlanRepository.find({
      where: { creditId },
      order: { installmentNo: 'ASC' },
    });

    const today = new Date();

    return paymentPlans.map((plan) => {
      const planDueDate = new Date(plan.dueDate);

      if (
        plan.status === PaymentPlanStatus.LATE ||
        (plan.status === PaymentPlanStatus.UNPAID && planDueDate < today)
      ) {
        const diffTime = Math.abs(today.getTime() - planDueDate.getTime());
        const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const lateFeeRate = Number(plan.lateFeeRate) || 0.0015;
        const installmentAmount = Number(plan.amount);

        const lateFee = Number(
          (installmentAmount * lateFeeRate * daysLate).toFixed(2),
        );
        const totalDue = Number((installmentAmount + lateFee).toFixed(2));

        return {
          ...plan,
          status: PaymentPlanStatus.LATE,
          currentLate: {
            daysLate,
            lateFee,
            totalDue,
          },
        };
      }

      return plan;
    });
  }

  async payPaymentPlan(paymentPlanId: string, userId: string) {
    const relations: FindOptionsRelations<PaymentPlan> = {
      credit: true,
    };

    const plan = await this.paymentPlanRepository.findOne({
      where: { id: paymentPlanId },
      relations,
    });

    if (!plan) {
      throw new NotFoundException('Ödeme planı bulunamadı.');
    }

    if (plan.credit.userId !== userId) {
      throw new ForbiddenException('Başkasına ait bir taksiti ödeyemezsiniz.');
    }

    if (
      plan.status !== PaymentPlanStatus.UNPAID &&
      plan.status !== PaymentPlanStatus.LATE
    ) {
      throw new BadRequestException({
        error: 'PAYMENT_PLAN_NOT_PAYABLE',
        message: 'Ödenmiş veya iptal edilmiş bir taksit tekrar ödenemez.',
      });
    }

    const previousUnpaidPlan = await this.paymentPlanRepository.findOne({
      where: [
        {
          creditId: plan.creditId,
          status: PaymentPlanStatus.UNPAID,
        },
        {
          creditId: plan.creditId,
          status: PaymentPlanStatus.LATE,
        },
      ],
      order: { installmentNo: 'ASC' },
    });

    if (
      previousUnpaidPlan &&
      previousUnpaidPlan.installmentNo < plan.installmentNo
    ) {
      throw new BadRequestException({
        error: 'PRIOR_INSTALLMENT_REQUIRED',
        message: `Öncelikle ${previousUnpaidPlan.installmentNo}. taksiti ödemelisiniz.`,
      });
    }

    let totalToPay = Number(plan.amount);
    const today = new Date();
    const dueDate = new Date(plan.dueDate);

    if (plan.status === PaymentPlanStatus.LATE || dueDate < today) {
      const diffTime = Math.abs(today.getTime() - dueDate.getTime());
      const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const lateFeeRate = Number(plan.lateFeeRate) || 0.0015;

      const lateFee = totalToPay * lateFeeRate * daysLate;
      totalToPay = Number((totalToPay + lateFee).toFixed(2));
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payment = queryRunner.manager.create(Payment, {
        userId,
        paymentPlanId: plan.id,
        amount: totalToPay,
        channel: PaymentChannel.MANUAL,
        type: PaymentType.FULL,
        status: PaymentStatus.SUCCEEDED,
      });
      await queryRunner.manager.save(Payment, payment);

      plan.status = PaymentPlanStatus.PAID;
      plan.paidAt = new Date();
      await queryRunner.manager.save(PaymentPlan, plan);

      const remainingUnpaidPlans = await queryRunner.manager.count(
        PaymentPlan,
        {
          where: [
            { creditId: plan.creditId, status: PaymentPlanStatus.UNPAID },
            { creditId: plan.creditId, status: PaymentPlanStatus.LATE },
          ],
        },
      );

      let isCreditCompleted = false;

      if (remainingUnpaidPlans === 0) {
        isCreditCompleted = true;

        await queryRunner.manager.update(Credit, plan.creditId, {
          status: CreditStatus.COMPLETED,
        });

        const creditLimit = await queryRunner.manager.findOne(CreditLimit, {
          where: { userId },
        });

        if (creditLimit) {
          const principalAmount = Number(plan.credit.amount);
          creditLimit.availableLimit =
            Number(creditLimit.availableLimit) + principalAmount;
          creditLimit.usedAmount =
            Number(creditLimit.usedAmount) - principalAmount;

          await queryRunner.manager.save(CreditLimit, creditLimit);
        }
      }

      await queryRunner.commitTransaction();

      await this.notificationsService.createNotification(
        userId,
        NotificationType.PAYMENT_SUCCESS,
        {
          creditId: plan.creditId,
          paymentPlanId: plan.id,
          paidAmount: totalToPay,
          installmentNo: plan.installmentNo,
        },
      );

      return {
        message: 'Taksit ödemesi başarıyla gerçekleştirildi.',
        paymentId: payment.id,
        paidAmount: totalToPay,
        status: plan.status,
        paidAt: plan.paidAt,
        isCreditCompleted,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async previewSnooze(paymentPlanId: string, userId: string) {
    const plan = await this.paymentPlanRepository.findOne({
      where: { id: paymentPlanId },
      relations: { credit: true },
    });

    if (!plan || plan.credit.userId !== userId) {
      throw new NotFoundException({
        error: 'PLAN_NOT_FOUND',
        message: 'Ödeme planı bulunamadı.',
      });
    }

    if (plan.status === PaymentPlanStatus.LATE) {
      throw new BadRequestException({
        error: 'CANNOT_SNOOZE_LATE_PLAN',
        message: 'Gecikmeye düşmüş bir taksit ertelenemez.',
      });
    }

    if (plan.status !== PaymentPlanStatus.UNPAID) {
      throw new BadRequestException({
        error: 'PAYMENT_PLAN_NOT_PAYABLE',
        message: 'Yalnızca ödenmemiş taksitler ertelenebilir.',
      });
    }

    const maxSnoozeCount = Number(
      this.configService?.get('MAX_SNOOZE_COUNT') ??
        process.env.MAX_SNOOZE_COUNT ??
        2,
    );

    if (plan.snoozeCount >= maxSnoozeCount) {
      throw new BadRequestException({
        error: 'SNOOZE_LIMIT_REACHED',
        message: `Bu taksit için maksimum erteleme sınırına (${maxSnoozeCount}) ulaşıldı.`,
      });
    }

    const snoozeFeeRate = Number(
      this.configService?.get('SNOOZE_FEE_RATE') ??
        process.env.SNOOZE_FEE_RATE ??
        0.05,
    );
    const snoozeExtensionDays = Number(
      this.configService?.get('SNOOZE_EXTENSION_DAYS') ??
        process.env.SNOOZE_EXTENSION_DAYS ??
        30,
    );

    const installmentAmount = Number(plan.amount);
    const snoozeFee = Number((installmentAmount * snoozeFeeRate).toFixed(2));

    const currentDueDate = new Date(plan.dueDate);
    const newDueDate = new Date(currentDueDate);
    newDueDate.setDate(newDueDate.getDate() + snoozeExtensionDays);

    return {
      paymentPlanId: plan.id,
      installmentNo: plan.installmentNo,
      installmentAmount,
      snoozeFee,
      snoozeFeeRate,
      currentDueDate: plan.dueDate,
      newDueDate: newDueDate.toISOString().split('T')[0],
      currentSnoozeCount: plan.snoozeCount,
      maxSnoozeCount,
    };
  }

  async snoozePaymentPlan(
    paymentPlanId: string,
    userId: string,
    idempotencyKey?: string,
  ) {
    const preview = await this.previewSnooze(paymentPlanId, userId);

    const plan = await this.paymentPlanRepository.findOne({
      where: { id: paymentPlanId },
      relations: { credit: true },
    });

    if (!plan) {
      throw new NotFoundException('Ödeme planı bulunamadı.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payment = queryRunner.manager.create(Payment, {
        userId,
        paymentPlanId: plan.id,
        amount: preview.snoozeFee,
        channel: PaymentChannel.MANUAL,
        type: PaymentType.SNOOZE,
        status: PaymentStatus.SUCCEEDED,
        idempotencyKey: idempotencyKey || `snooze_${plan.id}_${Date.now()}`,
      });
      await queryRunner.manager.save(Payment, payment);

      plan.dueDate = preview.newDueDate;
      plan.snoozeCount = Number(plan.snoozeCount) + 1;
      await queryRunner.manager.save(PaymentPlan, plan);

      await queryRunner.commitTransaction();

      return {
        message: 'Taksit başarıyla ertelendi.',
        paymentId: payment.id,
        paymentPlanId: plan.id,
        snoozeFeePaid: preview.snoozeFee,
        newDueDate: preview.newDueDate,
        snoozeCount: plan.snoozeCount,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  calculateRepayment(amount: number, termCount: number, scoreGroup = 'D') {
    const interestRates: Record<string, number> = {
      A: 0.015,
      B: 0.02,
      C: 0.025,
      D: 0.03,
    };
    const lateFeeRates: Record<string, number> = {
      A: 0.0005,
      B: 0.0008,
      C: 0.001,
      D: 0.0015,
    };

    const interestRate = interestRates[scoreGroup] ?? 0.03;
    const lateFeeRate = lateFeeRates[scoreGroup] ?? 0.0015;

    const totalInterest = amount * interestRate * termCount;
    const totalPayable = amount + totalInterest;
    const installmentAmount = Number((totalPayable / termCount).toFixed(2));

    const schedule: Array<{
      installmentNo: number;
      dueDate: string;
      amount: number;
      lateAmounts: Array<{
        daysLate: number;
        lateFee: number;
        totalDue: number;
      }>;
    }> = [];

    const today = new Date();

    for (let i = 1; i <= termCount; i++) {
      const dueDate = new Date(today);
      dueDate.setMonth(dueDate.getMonth() + i);

      const late7DaysFee = Number(
        (installmentAmount * lateFeeRate * 7).toFixed(2),
      );
      const late30DaysFee = Number(
        (installmentAmount * lateFeeRate * 30).toFixed(2),
      );

      schedule.push({
        installmentNo: i,
        dueDate: dueDate.toISOString().split('T')[0],
        amount: installmentAmount,
        lateAmounts: [
          {
            daysLate: 7,
            lateFee: late7DaysFee,
            totalDue: Number((installmentAmount + late7DaysFee).toFixed(2)),
          },
          {
            daysLate: 30,
            lateFee: late30DaysFee,
            totalDue: Number((installmentAmount + late30DaysFee).toFixed(2)),
          },
        ],
      });
    }

    return {
      amount,
      termCount,
      scoreGroup,
      interestRate,
      lateFeeRate,
      installmentAmount,
      totalPayable: Number(totalPayable.toFixed(2)),
      totalInterest: Number(totalInterest.toFixed(2)),
      schedule,
    };
  }
}
