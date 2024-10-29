import { Injectable } from '@nestjs/common';
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
  ) {
    const useDiscord = process.env.USE_DISCORD === 'true';
    const useTelegram = process.env.USE_TELEGRAM === 'true';

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
