import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global DTO Validation ve Whitelist Yapılandırması (Madde 7)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Madde 2: URI Tabanlı API Versiyonlama (/v1/auth/login vb.)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Madde 1: Swagger API Dokümantasyonu Yapılandırması
  const config = new DocumentBuilder()
    .setTitle('Credit Management API')
    .setDescription('Kredi Yönetim Sistemi API Dokümantasyonu')
    .setVersion('1.0')
    .addBearerAuth() // JWT Guard testleri için Swagger'a Authorize butonu ekler
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`Application is running on port: ${port}`);
  logger.log(`Swagger UI available at: http://localhost:${port}/api/docs`);
}

void bootstrap();