import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cross-Origin desteği
  app.enableCors();

  // Global DTO Validation Pipe (Gelen gövdeleri otomatik süzgeçten geçirir)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false, // Decorator olmayan alanların geçişine izin verir
      forbidNonWhitelisted: false, // Bilinmeyen/whitelist dışı alan hatasını fırlatmaz
      transform: true,
    }),
  );

  // Global Exception Filter Entegrasyonu
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Uygulama ${port} portunda sorunsuz çalışıyor.`);
}
bootstrap();
