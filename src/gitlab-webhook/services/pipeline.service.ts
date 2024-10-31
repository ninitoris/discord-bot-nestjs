import { Injectable } from '@nestjs/common';
import { CiJobDto } from '@src/gitlab-webhook/dto/pipeline/ciJob.dto';
import { PipelineWebhookBodyDto } from '@src/gitlab-webhook/dto/pipeline/pipelineWebhookBody.dto';
import { GitlabUtilityService } from '@src/gitlab-webhook/gitlab-utility.service';
import { GitLabUserService } from '@src/gitlab-webhook/services/gitlab-user.service';
import { NotificationService } from '@src/notification-service/notification-service';
import {
  GeneralNotificationType,
  TextWithURL,
} from '@src/notification-service/notification-strategy';
import { UtilsService } from '@src/utils/utils.service';

@Injectable()
export class PipelineService {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly gitlabUtils: GitlabUtilityService,
    private readonly utils: UtilsService,
    private readonly gitlabUserService: GitLabUserService,
  ) {}

  private async handleFailedPipeline(body: PipelineWebhookBodyDto) {
    const jobs: CiJobDto[] = body.builds;
    const objectAttributes = body.object_attributes;
    const gitlabUser = body.user;
    /** Первая зафейленная джоба. Их может быть несколько, но нам нужно найти только одну */
    const failedJob = jobs.find(
      (someJob: CiJobDto) =>
        someJob.status === 'failed' && someJob.allow_failure !== true,
    );
    const failedStage = failedJob.stage;
    const failedJobName = failedJob.name;

    const notificationDescription: TextWithURL = {
      text: 'Упал пайплайн',
      url: objectAttributes.url,
    };

    const additionalInfo: TextWithURL[] = [];
    additionalInfo.push(
      {
        text: `На стейдже ${failedStage}\n`,
      },

      {
        text: `На джобе ${failedJobName}\n`,
      },
    );

    if (failedJobName === 'commit lint') {
      additionalInfo.push(
        {
          text: '\nКакой-то commit message ИЛИ название МРа не сооветствует ',
        },
        {
          text: 'конвенциональному формату',
          url: 'https://www.conventionalcommits.org/en/v1.0.0/#summary',
        },
        {
          text: '\nДля изменения commit message можно воспользоваться ',
        },
        {
          text: 'этим гайдом',
          url: 'https://www.educative.io/answers/how-to-change-a-git-commit-message-after-a-push',
        },
        {
          text: '\n',
        },
      );
    }

    additionalInfo.push({
      text: this.gitlabUtils.addDefaultFooter({
        repo: body.project.name,
      }),
    });

    const notification: GeneralNotificationType = {
      notificationTitle: `CI/CD!`,
      notificationDescription,
      additionalInfo,
      notifyUsersIDs: [gitlabUser.id],
    };

    this.notificationService.sendNotification(notification);
    return;
  }

  public async handlePipeline(body: PipelineWebhookBodyDto) {
    const objectAttributes = body.object_attributes;
    const detailedStatus = objectAttributes.detailed_status;
    if (detailedStatus === 'failed') {
      return this.handleFailedPipeline(body);
    }
  }
}
