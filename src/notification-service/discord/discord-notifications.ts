import { Injectable } from '@nestjs/common';
import { DiscordNotificationType } from '@src/notification-service/discord/types/discord-notifications-types';
import { NotificationStrategy } from '@src/notification-service/notification-strategy';
import { EmbedBuilder, WebhookClient } from 'discord.js';

@Injectable()
export class DiscordNotificationStrategy implements NotificationStrategy {
  async sendNotification({
    notificationTitle,
    notificationSubject,
    notificationDescription,
    notificationUrl,
    embedColor,
    avatarURL,
    username,
  }: DiscordNotificationType) {
    const embed = new EmbedBuilder();
    const embedTitle = notificationSubject;
    const embedDescription = notificationDescription;
    const embedUrl = notificationUrl;

    embed.setTitle(embedTitle).setDescription(embedDescription);

    if (embedColor) embed.setColor(embedColor);
    if (embedUrl) embed.setURL(`${embedUrl}`);

    const notification = {
      content: notificationTitle,
      embeds: [embed],
      avatarURL: avatarURL,
      username: username,
    };

    const webhookClient = new WebhookClient({
      url: process.env.DISCORD_WEBHOOK,
    });

    await webhookClient.send(notification);
    // const result = await this.webhookClient.send(notification);

    // console.log('result:');
    // console.log(result);
    // return result;
    return;
  }
}
