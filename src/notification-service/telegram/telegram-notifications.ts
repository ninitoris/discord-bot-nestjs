import { Injectable } from '@nestjs/common';

@Injectable()
export class TelegramNotificationStrategy {
  private readonly token = process.env.TELEGRAM_TOKEN;
  private readonly chatId = process.env.TELEGRAM_CHAT_ID;
}
