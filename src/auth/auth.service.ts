import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { User } from '../users/entities/user.entity';
import { CreditLimit, ScoreGroup } from '../users/entities/credit-limit.entity';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CreditLimit)
    private readonly creditLimitRepository: Repository<CreditLimit>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Email adresi önceden alınmış mı kontrol et
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email address is already in use');
    }

    // 2. Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. Rastgele Skor Grubu belirle (A, B, C, D)
    const scoreGroups = [ScoreGroup.A, ScoreGroup.B, ScoreGroup.C, ScoreGroup.D];
    const randomGroup = scoreGroups[Math.floor(Math.random() * scoreGroups.length)];

    // 4. Grubun limitini .env dosyasından oku
    const baseLimit = Number(
      this.configService.get<number>(`SCORE_GROUP_LIMIT_${randomGroup}`),
    );

    // 5. Expiry tarihini hesapla (Bugün + CREDIT_LIMIT_EXPIRY_MONTHS)
    const expiryMonths = Number(
      this.configService.get<number>('CREDIT_LIMIT_EXPIRY_MONTHS', 6),
    );
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + expiryMonths);

    // 6. Kullanıcıyı oluştur
    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      phone: dto.phone,
    });

    const savedUser = await this.userRepository.save(user);

    // 7. Kullanıcıya Kredi Limiti atamasını yap
    const creditLimit = this.creditLimitRepository.create({
      userId: savedUser.id,
      scoreGroup: randomGroup,
      baseLimit: baseLimit,
      usedAmount: 0,
      availableLimit: baseLimit,
      expiresAt: expiresAt,
    });

    await this.creditLimitRepository.save(creditLimit);

    // 8. Auth Token (JWT) üretip dön
    const token = this.jwtService.sign({ sub: savedUser.id, email: savedUser.email });

    return {
      accessToken: token,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
        scoreGroup: randomGroup,
        baseLimit: baseLimit,
      },
    };
  }
}