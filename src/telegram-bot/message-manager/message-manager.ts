import { MessageStore } from '@src/telegram-bot/message-manager/message-store';
import { Context, Telegraf } from 'telegraf';
import * as tg from 'telegraf/types';
import { InjectBot } from 'nestjs-telegraf';
import { Injectable, Logger } from '@nestjs/common';
import { MyCoolContext } from '@src/telegram-bot/telegram-bot.update';

@Injectable()
export class MessageManager {
  constructor(
    public readonly store: MessageStore,
    @InjectBot() private readonly bot: Telegraf,
  ) {}

  public async cleanUpChat(chatID: number) {
    Logger.log(`cleaning up chat  ${chatID}`);
    await this.cleanUpUserMessages(chatID);

    await this.cleanUpBotMessages(chatID);
  }

  async cleanUpUserMessages(chatID: number) {
    const userMessages = await this.store.getUserMessages(chatID);
    if (userMessages.length) {
      await this.bot.telegram.deleteMessages(chatID, userMessages);
      await this.store.setUserMessages(chatID, []);
    }
  }

  async cleanUpBotMessages(chatID: number) {
    const botMessages = await this.store.getBotMessages(chatID);
    if (botMessages.length > 1) {
      const lastBotMessage = botMessages[botMessages.length - 1];
      const messagesToDelete = botMessages.slice(0, -1);
      await this.bot.telegram.deleteMessages(chatID, messagesToDelete);
      await this.store.setBotMessages(chatID, [lastBotMessage]);
    }
  }

  async tryToEditLastBotMessage(
    chatId: number,
    text: string,
    extra: tg.Convenience.ExtraEditMessageText,
  ): undefined | Promise<tg.Update.Edited & tg.Message.TextMessage> {
    const lastBotMessage = await this.store.getLastBotMessage(chatId);
    if (!lastBotMessage) {
      return undefined;
    }
    const message = await this.bot.telegram.editMessageText(
      chatId,
      lastBotMessage,
      undefined,
      text,
      extra,
    );
    if (typeof message === 'boolean') {
      Logger.error('Failed to edit latest message');
      return undefined;
    } else {
      return message;
    }
  }

  async sendMessageOrEditLast(
    ctx: Context,
    text: string,
    extra?:
      | tg.Convenience.ExtraReplyMessage
      | tg.Convenience.ExtraEditMessageText,
  ) {
    const chatId = ctx.chat.id;
    try {
      if (
        !extra ||
        (extra.reply_markup && 'inline_keyboard' in extra.reply_markup)
      ) {
        // пытаемся изменить последнее сообщение бота в чате
        const editedMessage = await this.tryToEditLastBotMessage(
          chatId,
          text,
          extra as tg.Convenience.ExtraEditMessageText,
        );
        if (editedMessage) {
          return editedMessage;
        }
      } else {
        Logger.error('No reply_markup or inline_keyboard in message extra!');
      }
    } catch (error) {
      Logger.warn('Could not edit last message');
      console.log(error);
    }

    // если не получилось изменить последнее сообщение, отправляем новое
    const message = await this.sendNewMessage(ctx, text, extra);
    return message;
  }

  async sendNewMessage(
    ctx: Context,
    text: string,
    extra?:
      | tg.Convenience.ExtraReplyMessage
      | tg.Convenience.ExtraEditMessageText,
  ) {
    const chatID = ctx.chat.id;
    const message = await ctx.sendMessage(text, extra);
    const messageId = message.message_id;
    await this.store.appendBotMessage(chatID, messageId);

    return message;
  }

  async userSentSomething(ctx: MyCoolContext) {
    if (
      'callback_query' in ctx.update &&
      'message' in ctx.update.callback_query
    ) {
      const msgId = ctx.update.callback_query.message.message_id;
      const chatId = ctx.update.callback_query.message.chat.id;
      await this.store.appendUserMessage(chatId, msgId);
    } else if ('message' in ctx.update) {
      const msgId = ctx.update.message.message_id;
      const chatId = ctx.update.message.chat.id;
      await this.store.appendUserMessage(chatId, msgId);
    } else if ('message' in ctx) {
      const msgId = ctx.message.message_id;
      const chatId = ctx.chat.id;
      await this.store.appendUserMessage(chatId, msgId);
    } else {
      Logger.error('Not found message in ctx');
      console.log(ctx);
    }
  }

  async msg(
    ctx: Context,
    text: string,
    extra?:
      | tg.Convenience.ExtraReplyMessage
      | tg.Convenience.ExtraEditMessageText,
  ) {
    await this.sendMessageOrEditLast(ctx, text, extra);
    await this.cleanUpChat(ctx.chat.id);
  }
}
