import { Injectable } from '@nestjs/common';
import { GeneralNotificationType } from '@src/notification-service/notification-strategy';
import { sendMessage } from './telegram-bot';

@Injectable()
export class TelegramNotificationStrategy {
  private readonly token = process.env.TELEGRAM_TOKEN;
  private readonly chatId = process.env.TELEGRAM_CHAT_ID;

  sendNotification(options: GeneralNotificationType) {
    console.log(options, 'goida');
    sendMessage(options);
  }

  public sendMsgInGroupChat(options: GeneralNotificationType) {
    console.log(options, 'goida');
    sendMessage(options);
  }
}
