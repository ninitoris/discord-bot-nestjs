import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENVIRONMENT_KEY } from '@src/constants/env-keys';
import { GitLabUserService } from '@src/gitlab-webhook/services/gitlab-user.service';
import {
  GeneralNotificationType,
  NotificationStrategy,
} from '@src/notification-service/notification-strategy';
import { UtilsService } from '@src/utils/utils.service';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

interface TelegramMessageType extends GeneralNotificationType {}

@Injectable()
export class TelegramNotificationStrategy implements NotificationStrategy {
  constructor(
    @InjectBot() private readonly bot: Telegraf,
    private readonly gitLabUserService: GitLabUserService,
    private readonly utils: UtilsService,
    private readonly configService: ConfigService,
  ) {}

  private readonly chatId = this.configService.get(
    ENVIRONMENT_KEY.TELEGRAM_CHAT_ID,
  );

  async sendNotification(options: TelegramMessageType) {
    console.log(options);

    const {
      notificationTitle,
      notificationSubject,
      notificationDescription,
      notifyUsersIDs,
      notificationUrl,
    } = options;

    const { tags, usersTelegramIDs } =
      this.getTelegramTagsByUserIDs(notifyUsersIDs);

    let messageBodyWithTags = '';
    messageBodyWithTags += `**${this.utils.escapeMarkdown(notificationTitle)} ${tags}**\n`;
    messageBodyWithTags += `**[${this.utils.escapeMarkdown(notificationSubject)}](${notificationUrl})**\n`;
    messageBodyWithTags += `\n${this.utils.escapeMarkdown(notificationDescription)}`;

    this.bot.telegram.sendMessage(this.chatId, messageBodyWithTags, {
      parse_mode: 'MarkdownV2',
      disable_notification: true,
      link_preview_options: {
        is_disabled: true, // выключил превью ссылок, потому что ссылки на gitlab.interprocom.ru у нас выглядят не очень красиво
      },
    });

    if (usersTelegramIDs.length) {
      let messageBodyNoTags = '';
      messageBodyNoTags += `**${this.utils.escapeMarkdown(notificationTitle)}**\n`;
      messageBodyNoTags += `**[${this.utils.escapeMarkdown(notificationSubject)}](${notificationUrl})**\n`;
      messageBodyNoTags += `\n${this.utils.escapeMarkdown(notificationDescription)}`;

      for (const usersTelegramID of usersTelegramIDs) {
        this.bot.telegram.sendMessage(usersTelegramID, messageBodyNoTags, {
          parse_mode: 'MarkdownV2',
          disable_notification: true,
          link_preview_options: {
            is_disabled: true,
          },
        });
      }
    }
  }

  private getTelegramTagsByUserIDs(notifyUsersIDs: Array<number>): {
    tags: string;
    usersTelegramIDs: Array<number>;
  } {
    const tags: Array<string> = [];
    const usersTelegramIDs: Array<number> = [];
    for (const userId of notifyUsersIDs) {
      const { tag, usersTelegramID } =
        this.getTelegramNameAndIdByUserId(userId);
      if (tag) tags.push(tag);
      if (usersTelegramID) usersTelegramIDs.push(usersTelegramID);
    }
    return {
      tags: tags.join(' '),
      usersTelegramIDs: usersTelegramIDs,
    };
  }

  private getTelegramNameAndIdByUserId(userId: number): {
    tag?: string;
    usersTelegramID?: number;
  } {
    const user = this.gitLabUserService.getUserById(userId);
    if (!user) return;

    const tag = '@' + (user.telegramUsername || user.irlName);
    const usersTelegramID = user.telegramID;

    return {
      tag,
      usersTelegramID,
    };
  }
}
