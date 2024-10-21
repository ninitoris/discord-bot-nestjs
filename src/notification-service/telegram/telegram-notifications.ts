import { Injectable } from '@nestjs/common';
import { GeneralNotificationType } from '@src/notification-service/notification-strategy';
import * as TelegramBot from 'node-telegram-bot-api';

interface TelegramMessageType extends GeneralNotificationType {}

@Injectable()
export class TelegramNotificationStrategy {
  private readonly token = process.env.TELEGRAM_TOKEN;
  private readonly chatId = process.env.TELEGRAM_CHAT_ID;
  private readonly bot = new TelegramBot(this.token, { polling: true });

  sendNotification() {}

  public sendMsgInGroupChat(options: TelegramMessageType) {
    console.log(options);

    const { notificationTitle, notificationDescription } = options;

    let messageBody = '';
    messageBody += `<b>${notificationTitle}</b>\n`;
    messageBody += `${notificationDescription}`;

    this.bot.sendMessage(this.chatId, messageBody, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      disable_notification: false,
    });
  }
}
