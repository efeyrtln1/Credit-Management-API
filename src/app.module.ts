import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { CreditLimit } from './users/entities/credit-limit.entity';
import { Credit } from './credits/entities/credit.entity';
import { PaymentPlan } from './credits/entities/payment-plan.entity';
import { Payment } from './payments/entities/payment.entity';
import { Notification } from './notifications/entities/notification.entity';

@Module({
  imports: [
    // Çevre Değişkenleri Konfigürasyonu
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Madde 12: Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => [
        {
          ttl: 60000, // 1 dakika (milisaniye)
          limit: 60,  // Maksimum 60 istek
        },
      ],
    }),

    // Veritabanı Bağlantısı
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'credit_db'),
        entities: [User, CreditLimit, Credit, PaymentPlan, Payment, Notification],
        synchronize: false,
      }),
    }),

    // Proje Modülleri
    AuthModule,
    UsersModule,
  ],
  providers: [],
})
export class AppModule {}