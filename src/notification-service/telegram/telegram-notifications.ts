import { Injectable } from '@nestjs/common';
import { GitLabUserService } from '@src/gitlab-webhook/services/gitlab-user.service';
import {
  GeneralNotificationType,
  NotificationStrategy,
} from '@src/notification-service/notification-strategy';
import { TelegramBotService } from '@src/telegram-bot/telegram-bot.service';
import { UtilsService } from '@src/utils/utils.service';

interface TelegramMessageType extends GeneralNotificationType {}

@Injectable()
export class TelegramNotificationStrategy implements NotificationStrategy {
  private readonly chatId = process.env.TELEGRAM_CHAT_ID;

  constructor(
    private readonly bot: TelegramBotService,
    private readonly gitLabUserService: GitLabUserService,
    private readonly utils: UtilsService,
  ) {}

  async sendNotification(options: TelegramMessageType) {
    console.log(options);

    const {
      notificationTitle,
      notificationSubject,
      notificationDescription,
      notifyUsersIDs,
      notificationUrl,
    } = options;

    const tags: string = this.getTelegramTagsByUserIDs(notifyUsersIDs);

    let messageBody = '';
    messageBody += `**${this.utils.escapeMarkdown(notificationTitle)} ${tags}**\n`;
    messageBody += `**[${this.utils.escapeMarkdown(notificationSubject)}](${notificationUrl})**\n`;
    messageBody += `\n${this.utils.escapeMarkdown(notificationDescription)}`;

    this.bot.sendMessageToGroupChat(this.chatId, messageBody, {
      parse_mode: 'MarkdownV2',
    });
  }

  private getTelegramTagsByUserIDs(notifyUsersIDs: Array<number>): string {
    const tags: Array<string> = [];
    for (const userId of notifyUsersIDs) {
      const tgID = this.getTelegramTagOrNameByUserID(userId);
      if (tgID) tags.push(tgID);
    }
    return tags.join(' ');
  }

  private getTelegramTagOrNameByUserID(userId: number): string | undefined {
    const user = this.gitLabUserService.getUserById(userId);
    if (!user) return;

    return user.telegramID || user.irlName;
  }
}
