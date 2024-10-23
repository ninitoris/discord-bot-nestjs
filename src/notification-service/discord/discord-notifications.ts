import { Injectable } from '@nestjs/common';
import { GitLabUserService } from '@src/gitlab-webhook/services/gitlab-user.service';
import { DiscordNotificationType } from '@src/notification-service/discord/types/discord-notifications-types';
import { NotificationStrategy } from '@src/notification-service/notification-strategy';
import { EmbedBuilder, WebhookClient } from 'discord.js';

@Injectable()
export class DiscordNotificationStrategy implements NotificationStrategy {
  constructor(private readonly gitLabUserService: GitLabUserService) {}

  public readonly gitlabColor = 0xfc6d26;
  public readonly gitlabLogo =
    'https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/144_Gitlab_logo_logos-512.png';
  public readonly gitlabBotName = 'GitLab';

  async sendNotification({
    notificationTitle,
    notificationSubject,
    notificationDescription,
    notificationUrl,
    notifyUsersIDs,
    embedColor = this.gitlabColor,
    avatarURL = this.gitlabLogo,
    username = this.gitlabBotName,
  }: DiscordNotificationType) {
    const embed = new EmbedBuilder();
    const tags = this.getDiscordTagsByUserIds(notifyUsersIDs);
    const embedTitle = notificationSubject;
    const embedDescription = notificationDescription;
    const embedUrl = notificationUrl;

    embed.setTitle(embedTitle).setDescription(embedDescription);

    if (embedColor) embed.setColor(embedColor);
    if (embedUrl) embed.setURL(`${embedUrl}`);

    const notification = {
      content: notificationTitle + ' ' + tags,
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

  getDiscordTagsByUserIds(
    /** Массив id-шников пользователей гитлаба */
    userIds: Array<number>,
    /** Высылать ли уведомления. Если true, то возвращает строку, которая будет тэгать пользователей в сообщении. Если false, то возвращает только имена пользователей, чтобы было понятно, кому адресовано сообщение, но уведомления не будет */
    notify: boolean = true,
  ): string {
    const tagsArray: Array<string> = userIds.map((userId) => {
      if (this.gitLabUserService.gitlabUsersMap.has(userId)) {
        if (notify) {
          return `<@${this.gitLabUserService.gitlabUsersMap.get(userId).discordId.toString()}>`;
        } else
          return `@${this.gitLabUserService.gitlabUsersMap.get(userId).irlName}`;
      } else return userId.toString(); // TODO: получить имя пользователя из гитлаба
    });

    return tagsArray.join(' ');
  }
}
