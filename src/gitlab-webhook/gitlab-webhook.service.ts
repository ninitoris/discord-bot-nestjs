import { Injectable } from '@nestjs/common';
import { WebhookType } from './gitlab-webhook.types';
import { MergeRequestService } from './services/merge-request.service';
import { PipelineService } from '@src/gitlab-webhook/services/pipeline.service';
import { NoteService } from '@src/gitlab-webhook/services/note.service';
import { GitlabUtilityService } from '@src/gitlab-webhook/gitlab-utility.service';
import { NotificationService } from '@src/notification-service/notification-service';
import {
  GeneralNotificationType,
  TextWithURL,
} from '@src/notification-service/notification-strategy';

@Injectable()
export class GitlabWebhookService {
  constructor(
    private readonly mergeRequestService: MergeRequestService,
    private readonly pipelineService: PipelineService,
    private readonly notificationService: NotificationService,
    private readonly gitlabUtils: GitlabUtilityService,
    private readonly noteService: NoteService,
  ) {}

  handleGitlabRequest(body: any): void {
    const type: WebhookType = body.object_kind;
    switch (type) {
      case 'merge_request': {
        this.mergeRequestService.handleMergeRequest(body);
        break;
      }
      case 'pipeline': {
        this.pipelineService.handlePipeline(body);
        break;
      }
      case 'note': {
        // comment on mr or somewhere else
        this.noteService.handleNote(body);
        break;
      }
      case 'build': {
        // Job Hook
        break;
      }
      default: {
        const unknownType: never = type; // Для ошибки сборки при добавлении нового типа
        throw new Error('Unknown webhook type: ' + unknownType);
      }
    }
  }

  async sendStageDeployNotification(body: any) {
    /** Пользователь, кто запустил пайплайн */
    const gitLabUserId = Number(body.userId);

    const host = body.host;
    const port = body.port;

    const notificationDescription: TextWithURL = {
      text: 'Произошел деплой',
    };
    const additionalInfo: TextWithURL[] = [
      {
        text: `На https://${host}:${port} \n`,
      },
    ];

    additionalInfo.push({
      text: this.gitlabUtils.addDefaultFooter({
        repo: body.repo,
      }),
    });

    const notification: GeneralNotificationType = {
      notificationTitle: `GOL!`,
      notificationDescription,
      additionalInfo,
      notifyUsersIDs: [gitLabUserId],
    };

    this.notificationService.sendNotification(notification);
    return;
  }

  async sendGolNotification() {
    const notification: GeneralNotificationType = {
      notificationTitle: `ГООООООООООЛ ⚽️`,
      notificationDescription: { text: '' },
      additionalInfo: [{ text: '' }],
      notifyUsersIDs: [],
    };
    this.notificationService.sendNotification(notification);
  }
}
