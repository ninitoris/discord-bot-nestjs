import { Injectable } from '@nestjs/common';
import {
  DiscordNotificationService,
  DiscordNotificationType,
} from '@src/discord-notification/discord-notification.service';
import { CiJobDto } from '@src/gitlab-webhook/dto/pipeline/ciJob.dto';
import { PipelineWebhookBodyDto } from '@src/gitlab-webhook/dto/pipeline/pipelineWebhookBody.dto';
import { GitlabUtilityService } from '@src/gitlab-webhook/gitlab-utility.service';
import { GitLabUserService } from '@src/gitlab-webhook/services/gitlab-user.service';
import { UtilsService } from '@src/utils/utils.service';

@Injectable()
export class PipelineService {
  constructor(
    private readonly discordNotificationService: DiscordNotificationService,
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

    const tag = this.gitlabUserService.getDiscordTagsByUserIds(
      [gitlabUser.id],
      this.utils.isNowWorkingHours(),
    );

    const embedTitle = 'Упал пайплайн';
    let embedDescription = `На стейдже ${failedStage}\n`;
    embedDescription += `На джобе ${failedJobName}\n`;

    if (failedJobName === 'commit lint') {
      embedDescription += `\nКакой-то commit message ИЛИ название МРа не сооветствует [конвенциональному формату](https://www.conventionalcommits.org/en/v1.0.0/#summary)\n`;
      embedDescription += `Для изменения commit message можно воспользоваться [этим гайдом](https://www.educative.io/answers/how-to-change-a-git-commit-message-after-a-push)\n`;
    }

    embedDescription += this.gitlabUtils.addDefaultFooter({
      repo: body.project.name,
    });

    const notification: DiscordNotificationType = {
      notificationTitle: `CI/CD! ${tag}`,
      embedTitle,
      embedDescription,
      embedUrl: objectAttributes.url,
      ...this.gitlabUtils.defaultNotificationTemplate,
    };

    this.discordNotificationService.sendNotification(notification);
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
