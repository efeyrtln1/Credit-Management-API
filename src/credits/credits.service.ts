import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Credit, CreditStatus } from './entities/credit.entity';
import { PaymentPlan, PaymentPlanStatus } from './entities/payment-plan.entity';
import { CreditLimit } from '../users/entities/credit-limit.entity';
import { UsersService } from '../users/users.service';
import { ApplyCreditDto } from './dto/apply-credit.dto';

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(Credit)
    private readonly creditRepository: Repository<Credit>,
    @InjectRepository(PaymentPlan)
    private readonly paymentPlanRepository: Repository<PaymentPlan>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  async applyForCredit(userId: string, applyCreditDto: ApplyCreditDto) {
    const { amount, termCount } = applyCreditDto;

    // 1. Kullanıcının limit durumunu kontrol et
    const creditLimit = await this.usersService.getCreditLimitByUserId(userId);

    if (Number(creditLimit.availableLimit) < amount) {
      throw new BadRequestException(
        'Kullanılabilir kredi limitiniz bu başvuru için yetersizdir.',
      );
    }

    // 2. Faiz ve Taksit Hesaplama (Aylık %2.5 sabit faiz)
    const monthlyInterestRate = 0.025;
    const totalPayable = amount * (1 + monthlyInterestRate * termCount);
    const monthlyInstallment = totalPayable / termCount;

    // Transaction başlatıyoruz
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 3. Kredi Kaydını Oluştur
      const credit = this.creditRepository.create({
        userId,
        amount,
        termCount,
        interestRate: monthlyInterestRate,
        totalPayable,
        status: CreditStatus.ACTIVE,
      });

      const savedCredit = await queryRunner.manager.save(Credit, credit);

      // 4. Taksit Planını Oluştur
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
          lateFeeRate: 0,
          snoozeCount: 0,
        });

        paymentPlans.push(plan);
      }

      await queryRunner.manager.save(PaymentPlan, paymentPlans);

      // 5. Kullanıcının Limitini Güncelle
      creditLimit.availableLimit = Number(creditLimit.availableLimit) - amount;
      creditLimit.usedAmount = Number(creditLimit.usedAmount) + amount;
      await queryRunner.manager.save(CreditLimit, creditLimit);

      await queryRunner.commitTransaction();

      return {
        message:
          'Kredi başvurunuz başarıyla onaylandı ve taksit planı oluşturuldu.',
        credit: savedCredit,
        paymentPlansSummary: {
          totalPayable,
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

  // 👈 DAY 4: Borç Hesaplayıcı (Calculator) Metodu
  // DAY 4: Borç Hesaplayıcı (Calculator) Metodu
  async calculateRepayment(
    amount: number,
    termCount: number,
    scoreGroup = 'D',
  ) {
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

    // 👈 'schedule' dizisine explicit tip tanımlaması yapıldı
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