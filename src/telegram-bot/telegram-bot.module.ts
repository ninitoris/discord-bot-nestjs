import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MessageManager } from '@src/telegram-bot/message-manager/message-manager';
import { MessageStore } from '@src/telegram-bot/message-manager/message-store';
import { NotificationsSetupWizard } from '@src/telegram-bot/scenes/notifications-setup.wizard';
import { TestWizard } from '@src/telegram-bot/scenes/test.wizard';
import { TelegramBotUpdate } from '@src/telegram-bot/telegram-bot.update';
import { UtilsModule } from '@src/utils/utils.module';
import { UtilsService } from '@src/utils/utils.service';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { RegisterWizard } from './scenes/register.wizard';
import { GitLabApiModule } from '../gitlab-api/gitlab-api.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule, UtilsModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        middlewares: [session()],
        token: configService.get<string>('TELEGRAM_TOKEN'),
      }),
    }),
    GitLabApiModule,
    UserModule,
  ],
  providers: [
    TelegramBotUpdate,
    NotificationsSetupWizard,
    TestWizard,
    UtilsService,
    MessageStore,
    MessageManager,
    RegisterWizard,
  ],
  exports: [],
})
export class TelegramBotModule {}
