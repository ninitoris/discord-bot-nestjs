import * as TelegramBot from 'node-telegram-bot-api';

export class TelegramBotTest {
  private readonly token = process.env.TELEGRAM_TOKEN;
  private readonly chatId = process.env.TELEGRAM_CHAT_ID;
  private readonly bot = new TelegramBot(this.token, { polling: true });

  public sendMsgInGroupChat() {
    this.bot.sendMessage(this.chatId, 'Gol test');
  }
}
