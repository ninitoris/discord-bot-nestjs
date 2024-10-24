import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';
import { getBotToken } from 'nestjs-telegraf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const bot = app.get(getBotToken());
  app.setGlobalPrefix('/rest/api/3');
  app.use(bot.webhookCallback('/secret-path'));

  await app.listen(8444);
}
bootstrap();
