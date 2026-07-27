import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global DTO Validation ve Whitelist Yapılandırması (Madde 7)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO'da tanımlanmamış alanları otomatik olarak temizler
      forbidNonWhitelisted: true, // DTO dışı beklenmeyen veri gelirse 400 hatası fırlatır
      transform: true, // Gelen payload tiplerini DTO tiplerine otomatik dönüştürür
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on port: ${port}`);
}

void bootstrap();