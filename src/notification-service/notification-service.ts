import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENVIRONMENT_KEY } from '@src/constants/env-keys';
import { DiscordNotificationStrategy } from '@src/notification-service/discord/discord-notifications';
import {
  GeneralNotificationType,
  NotificationStrategy,
} from '@src/notification-service/notification-strategy';
import { TelegramNotificationStrategy } from '@src/notification-service/telegram/telegram-notifications';

@Injectable()
export class NotificationService {
  private strategies: NotificationStrategy[] = [];

  constructor(
    private readonly discordNotificationStrategy: DiscordNotificationStrategy,
    private readonly telegramNotificationStrategy: TelegramNotificationStrategy,
    private readonly configService: ConfigService,
  ) {
    const useDiscord =
      this.configService.get(ENVIRONMENT_KEY.USE_DISCORD) === 'true';
    const useTelegram =
      this.configService.get(ENVIRONMENT_KEY.USE_TELEGRAM) === 'true';

    if (useDiscord) {
      this.strategies.push(discordNotificationStrategy);
    }

    if (useTelegram) {
      this.strategies.push(telegramNotificationStrategy);
    }
  }

  sendNotification(options: GeneralNotificationType) {
    for (const strategy of this.strategies) {
      strategy.sendNotification(options);
    }
  }
}
