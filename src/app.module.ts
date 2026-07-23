import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validate } from './config/env.validation';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CreditsModule } from './credits/credits.module';

@Module({
  imports: [
    // 1. ConfigModule: .env dosyasını okur ve kurallara uygun mu diye validate() ile kontrol eder.
    ConfigModule.forRoot({
      isGlobal: true, // Projenin her yerinde env değişkenlerini kullanılabilir yapar
      validate,       // env.validation.ts dosyasından gelen kontrol fonksiyonu
    }),

    // 2. TypeOrmModule: Veritabanı bağlantısı (.env verileriyle dinamik kurulur)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true, // İlerleyen adımlarda migration'a geçince false yapacağız
      }),
    }),

    // Projedeki Modüller
    UsersModule,
    CreditsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}