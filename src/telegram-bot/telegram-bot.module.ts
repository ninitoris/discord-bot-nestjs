import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegramBotService } from '@src/telegram-bot/telegram-bot.service';
import { TelegramBotUpdate } from '@src/telegram-bot/telegram-bot.update';
import { TelegrafModule } from 'nestjs-telegraf';
import { UserModule } from '../user/user.module';
import { GitLabApiModule } from '../gitlab-api/gitlab-api.module';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        token: configService.get('TELEGRAM_TOKEN'),
      }),
    }),
    UserModule,
    GitLabApiModule,
  ],
  providers: [TelegramBotService, TelegramBotUpdate],
  exports: [TelegramBotService],
})
export class TelegramBotModule {}
