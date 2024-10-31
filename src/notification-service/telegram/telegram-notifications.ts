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
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';

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
    const {
      notificationTitle,
      notificationDescription,
      additionalInfo,
      notifyUsersIDs,
    } = options;

    const escapedTitle = this.utils.escapeMarkdown(notificationTitle);
    const { tags, usersTelegramIDs } =
      this.getTelegramTagsByUserIDs(notifyUsersIDs);

    let messageBody = '';
    messageBody += this.utils.getMarkdownTextWithUrl(
      notificationDescription,
      true,
    );
    messageBody += '\n\n';
    messageBody += this.utils.getMarkdownTextWithUrl(additionalInfo, true);

    const messageWithTags = `${escapedTitle} ${tags}\n${messageBody}`;

    const extra: ExtraReplyMessage = {
      parse_mode: 'MarkdownV2',
      link_preview_options: {
        is_disabled: true, // выключил превью ссылок, потому что ссылки на gitlab.interprocom.ru у нас выглядят не очень красиво
      },
    };

    const messageThreadId = this.configService.get(
      ENVIRONMENT_KEY.MESSAGE_THREAD_ID,
    );

    if (messageThreadId) {
      extra.message_thread_id = messageThreadId; // для суперчата
    }

    await this.bot.telegram.sendMessage(this.chatId, messageWithTags, extra);

    if (usersTelegramIDs.length) {
      const messageWithoutTags = `${escapedTitle} \n${messageBody}`;

      if (messageThreadId) {
        delete extra.message_thread_id;
      }

      for (const usersTelegramID of usersTelegramIDs) {
        await this.bot.telegram.sendMessage(
          usersTelegramID,
          messageWithoutTags,
          extra,
        );
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
