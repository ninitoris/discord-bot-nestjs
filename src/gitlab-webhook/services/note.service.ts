import { Injectable } from '@nestjs/common';
import { NoteWebhookBodyDto } from '@src/gitlab-webhook/dto/note/noteWebhookBody.dto';
import { GitlabUtilityService } from '@src/gitlab-webhook/gitlab-utility.service';
import { GitLabUserService } from '@src/gitlab-webhook/services/gitlab-user.service';
import { NotificationService } from '@src/notification-service/notification-service';
import { GeneralNotificationType } from '@src/notification-service/notification-strategy';
import { UtilsService } from '@src/utils/utils.service';

@Injectable()
export class NoteService {
  constructor(
    private readonly gitlabUtils: GitlabUtilityService,
    private readonly gitlabUserService: GitLabUserService,
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
    const user = this.gitlabUserService.getUserById(gitlabUser.id);

    let notifyUsersIDs;
    if (note.includes('@')) {
      const reg = /@[a-zA-Z]+/g;
      const findTags = note.match(reg);
      notifyUsersIDs =
        this.gitlabUserService.getGitlabUserIDsByUserNames(findTags);
    }

    if (!notifyUsersIDs) {
      notifyUsersIDs = [mergeRequest.author_id];
    }

    // уведомить автора МРа либо кого тэгнули

    // в note нужно заменить блок кода на обычный однострочный код, чтобы это красиво выглядело в дискорде
    // TODO: перенести в discord notification strategy
    const beautifyNote = objectAttributes.note.trim().replaceAll('```', '`');

    const embedTitle = `${user.irlName} написал${user.female ? 'а' : ''} коммент к МРу`;

    let embedDescription = this.gitlabUtils.addMergeRequestInfo(mergeRequest);
    embedDescription += `\n${beautifyNote}\n`;

    embedDescription += this.gitlabUtils.addDefaultFooter({
      repo: mergeRequest.target.name,
    });

    const notification: GeneralNotificationType = {
      notificationTitle: `МР!`,
      notificationSubject: embedTitle,
      notificationDescription: embedDescription,
      notificationUrl: objectAttributes.url,
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
