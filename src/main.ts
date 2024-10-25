import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { AppDataSource } from './data-source';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('/rest/api/3');
  // Валидация сразу на все эндпоинты
  app.useGlobalPipes(new ValidationPipe());

  await AppDataSource.initialize();

  await app.listen(8444);
}
bootstrap();
