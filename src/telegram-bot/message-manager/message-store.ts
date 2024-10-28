import { Injectable } from '@nestjs/common';

type ChatCache = Array<number>;

@Injectable()
export class MessageStore {
  private readonly botMessages: Map<number, ChatCache> = new Map();
  private readonly userMessages: Map<number, ChatCache> = new Map();

  constructor() {}

  public async getLastBotMessage(chatID: number): Promise<number | undefined> {
    const chatCache = this.botMessages.get(chatID);
    if (!chatCache) {
      return undefined;
    }
    return chatCache[chatCache.length - 1];
  }

  public async getBotMessages(chatID: number): Promise<ChatCache> {
    let chatCache = this.botMessages.get(chatID);
    if (!chatCache) {
      chatCache = [];
      this.botMessages.set(chatID, chatCache);
    }
    return chatCache;
  }

  public async setBotMessages(
    chatID: number,
    messages: ChatCache,
  ): Promise<void> {
    this.botMessages.set(chatID, messages);
  }

  public async getUserMessages(chatID: number): Promise<ChatCache> {
    let chatCache = this.userMessages.get(chatID);
    if (!chatCache) {
      chatCache = [];
      this.userMessages.set(chatID, chatCache);
    }
    return chatCache;
  }

  public async setUserMessages(
    chatID: number,
    messages: ChatCache,
  ): Promise<void> {
    this.userMessages.set(chatID, messages);
  }

  public async appendBotMessage(
    chatID: number,
    messageID: number,
  ): Promise<void> {
    const chatCache = await this.getBotMessages(chatID);
    chatCache.push(messageID);
  }

  public async appendUserMessage(chatID: number, messageID: number) {
    const chatCache = await this.getUserMessages(chatID);
    chatCache.push(messageID);
  }
}
