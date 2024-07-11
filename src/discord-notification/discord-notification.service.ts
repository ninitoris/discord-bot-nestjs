import { Injectable } from '@nestjs/common';
import { EmbedBuilder, WebhookClient } from 'discord.js';

export type DiscordNotificationType = {
  /** Как будет подписан пользователь, который отправил сообщение */
  username: string;

  /** Заголовок уведомления, располагается над embed-ом, является по сути обычным текстом в сообщении */
  notificationTitle: string;

  /** Заголовок embed-а,  */
  embedTitle: string;

  /** Основной контекст embed-а */
  embedDescription: string;

  /** Ссылка, которая будет прикреплена к embed-у */
  embedUrl?: string;

  /** Цвет, в который будет окрашен embed */
  embedColor?: number;

  /** Ссылка на картинку, которая будет использована в качесве аватарки */
  avatarURL?: string;
};

@Injectable()
export class DiscordNotificationService {
  private readonly webhookClient = new WebhookClient({
    url: process.env.WEBHOOK,
  });

  async sendNotification({
    notificationTitle,
    embedTitle,
    embedDescription,
    embedUrl,
    embedColor,
    avatarURL,
    username,
  }: DiscordNotificationType) {
    const embed = new EmbedBuilder();

    embed.setTitle(embedTitle).setDescription(embedDescription);

    if (embedColor) embed.setColor(embedColor);
    if (embedUrl) embed.setURL(`${embedUrl}`);

    const notification = {
      content: notificationTitle,
      embeds: [embed],
      avatarURL: avatarURL,
      username: username,
    };

    const result = await this.webhookClient.send(notification);

    console.log('result:');
    console.log(result);
  }
}
