import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/entities/user.entity';
import { CreditLimit } from '../users/entities/credit-limit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, CreditLimit]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('FATAL ERROR: JWT_SECRET environment variable is not defined!');
        }

        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '1h';

        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as any, // TypeScript tip çakışmasını önlemek için
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}