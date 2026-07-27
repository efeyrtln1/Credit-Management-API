import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditLimit } from './entities/credit-limit.entity';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CreditLimit)
    private readonly creditLimitRepository: Repository<CreditLimit>,
  ) {}

  async getCreditLimitByUserId(userId: string): Promise<CreditLimit> {
    const creditLimit = await this.creditLimitRepository.findOne({
      where: { userId },
    });

    if (!creditLimit) {
      throw new NotFoundException('Kullanıcıya ait kredi limiti bulunamadı.');
    }

    return creditLimit;
  }

  async useCredit(userId: string, amount: number): Promise<CreditLimit> {
    const creditLimit = await this.getCreditLimitByUserId(userId);

    const availableLimitNum = Number(creditLimit.availableLimit);
    const usedAmountNum = Number(creditLimit.usedAmount);

    if (availableLimitNum < amount) {
      throw new BadRequestException('Yetersiz kredi limiti.');
    }

    creditLimit.availableLimit = availableLimitNum - amount;
    creditLimit.usedAmount = usedAmountNum + amount;

    return await this.creditLimitRepository.save(creditLimit);
  }
}
