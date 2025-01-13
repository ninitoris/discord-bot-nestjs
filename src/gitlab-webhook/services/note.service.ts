import { Injectable } from '@nestjs/common';
import { NoteWebhookBodyDto } from '@src/gitlab-webhook/dto/note/noteWebhookBody.dto';
import { GitlabUtilityService } from '@src/gitlab-webhook/gitlab-utility.service';
import { NotificationService } from '@src/notification-service/notification-service';
import {
  GeneralNotificationType,
  TextWithURL,
} from '@src/notification-service/notification-strategy';
import { UserService } from '@src/user/user.service';
import { UtilsService } from '@src/utils/utils.service';

@Injectable()
export class NoteService {
  constructor(
    private readonly gitlabUtils: GitlabUtilityService,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    private readonly utils: UtilsService,
  ) {}

  private async handleMergeRequestNote(body: NoteWebhookBodyDto) {
    // console.log('note event');
    const objectAttributes = body.object_attributes;
    // получить всех кого тэгнули в сообщении
    const note = objectAttributes.note;
    const mergeRequest = body.merge_request;

    const gitlabUser = body.user;
    const user = await this.userService.getUserByGitlabID(gitlabUser.id);

    let notifyUsersIDs;
    if (note.includes('@')) {
      const reg = /@[a-zA-Z]+/g;
      const findTags = note.match(reg);
      notifyUsersIDs =
        await this.userService.getGitlabUserIDsByUserNames(findTags);
    }

    if (
      !(
        notifyUsersIDs &&
        Array.isArray(notifyUsersIDs) &&
        notifyUsersIDs.length
      )
    ) {
      notifyUsersIDs = [mergeRequest.author_id];
    }

    // уведомить автора МРа либо кого тэгнули

    // в note нужно заменить блок кода на обычный однострочный код, чтобы это красиво выглядело в дискорде
    // TODO: перенести в discord notification strategy
    const beautifyNote = objectAttributes.note.trim().replaceAll('```', '`');

    const notificationTitle: TextWithURL = {
      text: `${user.name} написал${user.female ? 'а' : ''} коммент к МРу`,
      url: objectAttributes.url,
    };

    const additionalInfo: TextWithURL[] = [];
    additionalInfo.push(
      this.gitlabUtils.addMergeRequestTextAndLink(mergeRequest),
      {
        text: `\n${beautifyNote}\n`,
      },
      {
        text: this.gitlabUtils.addDefaultFooter({
          repo: mergeRequest.target.name,
        }),
      },
    );

    const notification: GeneralNotificationType = {
      notificationTitle: `МР!`,
      notificationDescription: notificationTitle,
      additionalInfo: additionalInfo,
      notifyUsersIDs,
    };
    this.notificationService.sendNotification(notification);
    return;
  }

  public async handleNote(body: NoteWebhookBodyDto) {
    const noteableType = body.object_attributes.noteable_type;
    switch (noteableType) {
      case 'MergeRequest':
        return this.handleMergeRequestNote(body);
      default:
        return;
    }
  }
}
