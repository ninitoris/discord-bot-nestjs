import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TgBotMessages } from '@src/telegram-bot/entities/tg-bot-messages.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class MessageStore {
  constructor(
    @InjectRepository(TgBotMessages)
    private readonly messagesRepository: Repository<TgBotMessages>,
  ) {}

  public async getLastBotMessage(
    chatID: number,
  ): Promise<TgBotMessages | null> {
    const lastBotMessage = await this.messagesRepository.findOne({
      where: {
        chatID: chatID,
        messageType: 'bot',
      },
      order: { id: 'DESC' },
    });
    return lastBotMessage;
  }

  public async getLastBotMessageID(chatID: number): Promise<number | null> {
    const lastBotMessage = await this.messagesRepository.findOne({
      where: {
        chatID: chatID,
        messageType: 'bot',
      },
      order: { id: 'DESC' },
      select: {
        messageID: true,
      },
    });
    return lastBotMessage?.messageID || null;
  }

  public async getBotMessages(chatID: number): Promise<Array<TgBotMessages>> {
    const botMessages = await this.messagesRepository.find({
      where: {
        chatID: chatID,
        messageType: 'bot',
      },
    });
    return botMessages;
  }

  public async getBotMessagesIDs(
    chatID: number,
  ): Promise<{ messageID: number }[]> {
    const botMessagesIDs: { messageID: number }[] =
      await this.messagesRepository.find({
        where: {
          chatID: chatID,
          messageType: 'bot',
        },
        select: {
          messageID: true,
        },
        order: {
          messageID: 'ASC',
        },
      });
    return botMessagesIDs;
  }

  public async getUserMessages(chatID: number): Promise<Array<TgBotMessages>> {
    const userMessages = await this.messagesRepository.find({
      where: {
        messageType: 'user',
        chatID: chatID,
      },
    });
    return userMessages;
  }

  public async getUserMessagesIDs(
    chatID: number,
  ): Promise<{ messageID: number }[]> {
    const userMessagesIDs: { messageID: number }[] =
      await this.messagesRepository.find({
        where: {
          messageType: 'user',
          chatID: chatID,
        },
        select: {
          messageID: true,
        },
      });
    return userMessagesIDs;
  }

  public async saveMessage(
    // chatID: number,
    message: TgBotMessages,
  ): Promise<void> {
    const res = await this.messagesRepository.save(message);
    // console.log('saveMessage res:');
    // console.log(res);
  }

  public async deleteMessage(chatID: number, messageID: number) {
    const res = await this.messagesRepository.softDelete({
      chatID: chatID,
      id: messageID,
    });
    console.log('deleteMessage res:');
    console.log(res);
  }

  public async deleteMessagesByIDs(chatID: number, messagesIDs: Array<number>) {
    const res = await this.messagesRepository.softDelete({
      chatID: chatID,
      messageID: In(messagesIDs),
    });
    console.log('deleteMessagesByIDs res:');
    console.log(res);
  }
}
