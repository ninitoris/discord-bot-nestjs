import { decryptEnvironmentVariables } from '@src/env-encryption';
decryptEnvironmentVariables();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import ConnectionSource from './database/data-source.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('/rest/api/3');
  // Валидация сразу на все эндпоинты
  app.useGlobalPipes(new ValidationPipe());

  await ConnectionSource.initialize();

  await app.listen(8444);
}
bootstrap();
