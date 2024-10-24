import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { FmtString } from 'telegraf/typings/format';
import * as tt from 'telegraf/src/telegram-types';

@Injectable()
export class TelegramBotService {
  constructor(@InjectBot() private readonly bot: Telegraf) {}

  async sendMessageToGroupChat(
    chatID: number | string,
    msg: string | FmtString,
    extra?: tt.ExtraReplyMessage,
  ) {
    await this.bot.telegram.sendMessage(chatID, msg, extra);
  }
}
