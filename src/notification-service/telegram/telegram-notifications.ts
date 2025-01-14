import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENVIRONMENT_KEY } from '@src/constants/env-keys';
import {
  GeneralNotificationType,
  NotificationStrategy,
} from '@src/notification-service/notification-strategy';
import { UserSettings } from '@src/user/entities/usersettings.entity';
import { UserService } from '@src/user/user.service';
import { UtilsService } from '@src/utils/utils.service';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';

interface TelegramMessageType extends GeneralNotificationType {}

@Injectable()
export class TelegramNotificationStrategy implements NotificationStrategy {
  constructor(
    @InjectBot() private readonly bot: Telegraf,
    private readonly userService: UserService,
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
      await this.getTelegramTagsByUserIDs(notifyUsersIDs);
    const escapeTags = this.utils.escapeMarkdown(tags);

    let messageBody = '';
    messageBody += this.utils.getMarkdownTextWithUrl(
      notificationDescription,
      true,
    );
    messageBody += '\n\n';
    messageBody += this.utils.getMarkdownTextWithUrl(additionalInfo, true);

    const messageWithTags = `${escapedTitle} ${escapeTags}\n${messageBody}`;

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

    try {
      await this.bot.telegram.sendMessage(this.chatId, messageWithTags, extra);
    } catch (e) {
      Logger.error('Caught error:');
      console.log(e);
      return;
    }

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

  private async getTelegramTagsByUserIDs(
    notifyUsersIDs: Array<number>,
  ): Promise<{
    tags: string;
    usersTelegramIDs: Array<number>;
  }> {
    const tags: Array<string> = [];
    const usersTelegramIDs: Array<number> = [];
    for (const userId of notifyUsersIDs) {
      const { tag, usersTelegramID } =
        await this.getTelegramTagAndIdByUserId(userId);
      if (tag) tags.push(tag);
      if (usersTelegramID) usersTelegramIDs.push(usersTelegramID);
    }
    return {
      tags: tags.join(' '),
      usersTelegramIDs: usersTelegramIDs,
    };
  }

  // возвращает упоминания тэги пользователей через @ с учетом настроек уведомлений
  private async getTelegramTagAndIdByUserId(userId: number): Promise<{
    tag: string;
    usersTelegramID: number;
  }> {
    const user = await this.userService.getUserByGitlabID(userId, {
      getNotificationSettings: true,
    });
    if (!user) return;

    const userSettings: UserSettings | undefined = user.userSettings;
    let settings: UserSettings;
    if (userSettings) {
      settings = new UserSettings();
      settings.useTelegram = userSettings.useTelegram;
      settings.tgGroupChatNotify =
        userSettings.useTelegram && userSettings.tgGroupChatNotify;
      settings.tgPrivateMessageNotify =
        userSettings.useTelegram && userSettings.tgPrivateMessageNotify;
    } else {
      // дефолтные настройки
      settings = new UserSettings();
      settings.useTelegram = true;
      settings.tgGroupChatNotify = true;
      settings.tgPrivateMessageNotify = true;
    }

    let tag: string = '@';
    if (user.telegramUsername && settings.tgGroupChatNotify) {
      tag += user.telegramUsername;
    } else {
      tag += ' ' + user.name;
    }

    const usersTelegramID = settings.tgPrivateMessageNotify
      ? user.telegramID
      : undefined;

    return {
      tag,
      usersTelegramID,
    };
  }
}
