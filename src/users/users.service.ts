import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditLimit, ScoreGroup } from './entities/credit-limit.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(CreditLimit)
    private readonly creditLimitRepository: Repository<CreditLimit>,
  ) {}

  async getCreditLimitByUserId(userId: string): Promise<CreditLimit> {
    const creditLimit = await this.creditLimitRepository.findOne({
      where: { userId },
    });

    if (!creditLimit) {
      throw new NotFoundException(
        'Kullanıcıya ait kredi limit bilgisi bulunamadı.',
      );
    }

    return creditLimit;
  }

  async useCredit(userId: string, amount: number): Promise<CreditLimit> {
    const creditLimit = await this.getCreditLimitByUserId(userId);

    const available = Number(creditLimit.availableLimit);
    if (available < amount) {
      throw new BadRequestException('Yetersiz kredi limiti.');
    }

    creditLimit.availableLimit = available - amount;
    creditLimit.usedAmount = Number(creditLimit.usedAmount) + amount;

    return this.creditLimitRepository.save(creditLimit);
  }

  async applyForLimitIncrease(userId: string, requestedAmount: number) {
    const creditLimit = await this.getCreditLimitByUserId(userId);

    // İş Kuralı: D skor grubu yüksek riskli olduğu için limit artırımı alamaz.
    if (creditLimit.scoreGroup === ScoreGroup.D) {
      return {
        status: 'REJECTED',
        message:
          'Kredi skor grubunuz (D) nedeniyle limit artırım talebiniz onaylanmadı.',
        currentLimit: creditLimit.baseLimit,
      };
    }

    const newBaseLimit = Number(creditLimit.baseLimit) + requestedAmount;
    const newAvailableLimit =
      Number(creditLimit.availableLimit) + requestedAmount;

    creditLimit.baseLimit = newBaseLimit;
    creditLimit.availableLimit = newAvailableLimit;

    const updatedLimit = await this.creditLimitRepository.save(creditLimit);

    return {
      status: 'APPROVED',
      message: 'Limit artırım talebiniz başarıyla onaylandı!',
      creditLimit: updatedLimit,
    };
  }
}
