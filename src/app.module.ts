import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { Reflector } from '@nestjs/core';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CreditsModule } from './credits/credits.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TasksModule } from './tasks/tasks.module';
import { RedisModule } from './common/redis/redis.module';

import { User } from './users/entities/user.entity';
import { CreditLimit } from './users/entities/credit-limit.entity';
import { Credit } from './credits/entities/credit.entity';
import { PaymentPlan } from './credits/entities/payment-plan.entity';
import { Payment } from './credits/entities/payment.entity';
import { Notification } from './notifications/entities/notification.entity';

@Module({
  imports: [
    // Çevre Değişkenleri Konfigürasyonu
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Schedule (Cron Jobs) Kurulumu
    ScheduleModule.forRoot(),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => [
        {
          ttl: 60000,
          limit: 60,
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
        entities: [
          User,
          CreditLimit,
          Credit,
          PaymentPlan,
          Payment,
          Notification,
        ],
        synchronize: true,
      }),
    }),

    // Proje Modülleri
    RedisModule,
    AuthModule,
    UsersModule,
    CreditsModule,
    NotificationsModule,
    TasksModule,
  ],
  providers: [Reflector],
})
export class AppModule {}
