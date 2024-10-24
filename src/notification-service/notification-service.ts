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
    //TODO
    // this.strategies.push(discordNotificationStrategy);
    this.strategies.push(telegramNotificationStrategy as any);
  }

  sendNotification(options: GeneralNotificationType) {
    for (const strategy of this.strategies) {
      strategy.sendNotification(options);
    }
  }
}
