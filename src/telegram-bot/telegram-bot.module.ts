import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegramBotService } from '@src/telegram-bot/telegram-bot.service';
import { TelegramBotUpdate } from '@src/telegram-bot/telegram-bot.update';
import { TelegrafModule } from 'nestjs-telegraf';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('TELEGRAM_TOKEN'),
      }),
    }),
  ],
  providers: [TelegramBotService, TelegramBotUpdate],
  exports: [TelegramBotService],
})
export class TelegramBotModule {}
