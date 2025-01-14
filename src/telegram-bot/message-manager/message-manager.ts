import { MessageStore } from '@src/telegram-bot/message-manager/message-store';
import { Context, Telegraf } from 'telegraf';
import * as tg from 'telegraf/types';
import { InjectBot } from 'nestjs-telegraf';
import { Injectable, Logger } from '@nestjs/common';
import { isTextMessage } from '@src/telegram-bot/types/telegram-bot-types';
import { TgBotMessages } from '@src/telegram-bot/entities/tg-bot-messages.entity';
import { FmtString } from 'telegraf/typings/format';

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

  async deleteMessage(chatID: number, messageID: number) {
    await this.store.deleteMessage(chatID, messageID);
    await this.bot.telegram.deleteMessage(chatID, messageID);
  }

  async cleanUpUserMessages(chatID: number) {
    const userMessages = await this.store.getUserMessagesIDs(chatID);
    if (userMessages.length) {
      const messagesIDs = userMessages.map((msg) => msg.messageID);
      await this.bot.telegram.deleteMessages(chatID, messagesIDs);
      await this.store.deleteMessagesByIDs(chatID, messagesIDs);
    }
  }

  async cleanUpBotMessages(chatID: number) {
    const botMessages = await this.store.getBotMessagesIDs(chatID);
    if (botMessages.length > 1) {
      const messagesIDs = botMessages.map((msg) => msg.messageID);
      // const lastBotMessage = messagesIDs[messagesIDs.length - 1];
      const messagesToDelete = messagesIDs.slice(0, -1);
      await this.store.deleteMessagesByIDs(chatID, messagesToDelete);
      await this.bot.telegram.deleteMessages(chatID, messagesToDelete);
    }
  }

  async tryToEditLastBotMessage(
    chatId: number,
    text: string,
    extra: tg.Convenience.ExtraEditMessageText,
  ): undefined | Promise<tg.Update.Edited & tg.Message.TextMessage> {
    const lastBotMessage = await this.store.getLastBotMessageID(chatId);
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
    chatId: number,
    text: string,
    extra?:
      | tg.Convenience.ExtraReplyMessage
      | tg.Convenience.ExtraEditMessageText,
  ): Promise<
    tg.Convenience.ExtraReplyMessage | tg.Convenience.ExtraEditMessageText
  >;
  async sendNewMessage(
    ctx: Context,
    text: string,
    extra?:
      | tg.Convenience.ExtraReplyMessage
      | tg.Convenience.ExtraEditMessageText,
  ): Promise<
    tg.Convenience.ExtraReplyMessage | tg.Convenience.ExtraEditMessageText
  >;
  async sendNewMessage(
    chatIdOrCtx: number | Context,
    text: string,
    extra?:
      | tg.Convenience.ExtraReplyMessage
      | tg.Convenience.ExtraEditMessageText,
  ) {
    let message: tg.Message.TextMessage;
    let chatID;
    if (typeof chatIdOrCtx === 'number' || typeof chatIdOrCtx === 'string') {
      chatID = chatIdOrCtx;
      message = await this.sendMsgInChat(chatID, text, extra);
    } else {
      chatID = chatIdOrCtx.chat.id;
      message = await chatIdOrCtx.sendMessage(text, extra);
    }
    // const messageId = message.message_id;

    const tgBotMessage = new TgBotMessages();
    tgBotMessage.userID = message.from.id;
    tgBotMessage.chatID = chatID;
    tgBotMessage.messageType = 'bot';
    tgBotMessage.messageText = text;
    tgBotMessage.messageID = message.message_id;
    tgBotMessage.timestamp = new Date(message.date * 1000);
    tgBotMessage.status = 'NEW';

    await this.store.saveMessage(tgBotMessage);

    return message;
  }

  async userSentSomething(ctx: Context) {
    if (
      'callback_query' in ctx.update &&
      'message' in ctx.update.callback_query
    ) {
      const chatType = ctx.update.callback_query.message.chat.type;
      if (chatType !== 'private') {
        return;
      }

      const chatID = ctx.update.callback_query.message.chat.id;
      const tgBotMessage = new TgBotMessages();
      tgBotMessage.userID = ctx.from.id;
      tgBotMessage.chatID = chatID;
      tgBotMessage.messageType = 'user';
      tgBotMessage.messageID = ctx.update.callback_query.message.message_id;
      // if (isTextMessage(ctx.update.callback_query.message)) {
      //   tgBotMessage.messageText = ctx.update.callback_query.message.text;
      // }
      tgBotMessage.timestamp = new Date(ctx.message.date * 1000);
      tgBotMessage.status = 'NEW';
      await this.store.saveMessage(tgBotMessage);
    } else if ('message' in ctx.update) {
      const chatType = ctx.update.message.chat.type;
      if (chatType !== 'private') {
        return;
      }

      const chatID = ctx.update.message.chat.id;

      const tgBotMessage = new TgBotMessages();
      tgBotMessage.userID = ctx.from.id;
      tgBotMessage.chatID = chatID;
      tgBotMessage.messageID = ctx.update.message.message_id;
      tgBotMessage.messageType = 'user';
      if (isTextMessage(ctx.update.message)) {
        tgBotMessage.messageText = ctx.update.message.text;
      }
      tgBotMessage.timestamp = new Date(ctx.message.date * 1000);
      tgBotMessage.status = 'NEW';
      await this.store.saveMessage(tgBotMessage);
    } else if ('message' in ctx) {
      const chatType = ctx.chat.type;
      if (chatType !== 'private') {
        return;
      }

      const tgBotMessage = new TgBotMessages();
      tgBotMessage.userID = ctx.from.id;
      tgBotMessage.chatID = ctx.chat.id;
      tgBotMessage.messageType = 'user';
      tgBotMessage.messageID = ctx.message.message_id;
      if (isTextMessage(ctx.message)) {
        tgBotMessage.messageText = ctx.message.text;
      }
      tgBotMessage.timestamp = new Date(ctx.message.date * 1000);
      tgBotMessage.status = 'NEW';
      await this.store.saveMessage(tgBotMessage);
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

  /**Отправить сообщение в чат по его id*/
  async sendMsgInChat(
    chatID: number,
    text: string,
    extra?:
      | tg.Convenience.ExtraReplyMessage
      | tg.Convenience.ExtraEditMessageText,
  ): Promise<tg.Message.TextMessage> {
    return await this.bot.telegram.sendMessage(chatID, text, extra);
  }

  async editMessage(
    chatId: number,
    messageId: number,
    text: string | FmtString,
    extra?: tg.Convenience.ExtraEditMessageText,
  ) {
    const message = await this.bot.telegram.editMessageText(
      chatId,
      messageId,
      undefined,
      text,
      extra,
    );
    if (typeof message === 'boolean') {
      Logger.error(`Failed to edit message ${messageId} in chat ${chatId}`);
      return undefined;
    } else {
      return message;
    }
  }
}
