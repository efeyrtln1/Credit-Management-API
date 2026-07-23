import {
  Injectable,
  BadRequestException,
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
import { LoginDto } from './dto/login.dto';

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
    const name = dto.name?.trim() || dto.fullName?.trim();
    if (!name) {
      throw new BadRequestException('name veya fullName alanı zorunludur');
    }

    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email address is already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const scoreGroups = [ScoreGroup.A, ScoreGroup.B, ScoreGroup.C, ScoreGroup.D];
    const randomGroup = scoreGroups[Math.floor(Math.random() * scoreGroups.length)];

    const baseLimit = Number(
      this.configService.get<number>(`SCORE_GROUP_LIMIT_${randomGroup}`),
    );

    const expiryMonths = Number(
      this.configService.get<number>('CREDIT_LIMIT_EXPIRY_MONTHS', 6),
    );
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + expiryMonths);

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      phone: dto.phone,
    });

    const savedUser = await this.userRepository.save(user);

    const creditLimit = this.creditLimitRepository.create({
      userId: savedUser.id,
      scoreGroup: randomGroup,
      baseLimit: baseLimit,
      usedAmount: 0,
      availableLimit: baseLimit,
      expiresAt: expiresAt,
    });

    await this.creditLimitRepository.save(creditLimit);

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

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userRepository.findOne({
      where: { email },
      relations: { creditLimit: true }, // Nesne formatına güncellendi
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        scoreGroup: user.creditLimit?.scoreGroup,
        availableLimit: user.creditLimit?.availableLimit,
      },
    };
  }
}