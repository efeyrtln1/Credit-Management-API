import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport'; // 1. Eklendi

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/entities/user.entity';
import { CreditLimit } from '../users/entities/credit-limit.entity';
import { JwtStrategy } from './strategies/jwt.strategy'; // 2. Eklendi

@Module({
  imports: [
    TypeOrmModule.forFeature([User, CreditLimit]),
    PassportModule, // 3. Imports kısmına eklendi
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('FATAL ERROR: JWT_SECRET environment variable is not defined!');
        }

        return {
          secret,
          signOptions: {
            expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '1h') as `${number}h` | `${number}d` | `${number}s`,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy], // 4. Providers kısmına JwtStrategy eklendi
})
export class AuthModule {}