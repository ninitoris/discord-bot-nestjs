import { Injectable } from '@nestjs/common';
import { MergeRequestAttributesDto } from '../dto/mergeRequestAttributes.dto';
import { MergeRequestDto } from '../dto/mergeRequest.dto';
import { GitLabApiService } from '@src/gitlab-api/gitlab-api.service';
import { GitlabUtilityService } from '@src/gitlab-webhook/gitlab-utility.service';
import {
  DiscordNotificationService,
  DiscordNotificationType,
} from '@src/discord-notification/discord-notification.service';
import { UtilsService } from '@src/utils/utils.service';
import { GitLabUserService } from '@src/gitlab-webhook/services/gitlab-user.service';

@Injectable()
export class MergeRequestService {
  constructor(
    private readonly gitlabApiService: GitLabApiService,
    private readonly gitlabUtils: GitlabUtilityService,
    private readonly discordNotificationService: DiscordNotificationService,
    private readonly utils: UtilsService,
    private readonly gitlabUserService: GitLabUserService,
  ) {}

  // TODO: Validation pipe
  handleMergeRequest(body: MergeRequestDto): void {
    console.log('handling mr');
    const objectAttributes: MergeRequestAttributesDto = body.object_attributes;
    const action = objectAttributes.action;

    switch (action) {
      case 'open':
      case 'reopen': {
        this.handleMergeRequestOpened(objectAttributes);
        break;
      }
      case 'approved': {
        this.handleMergeRequestApproved();
        break;
      }
      case 'update': {
        this.handleMergeRequestUpdated();
        break;
      }
      case 'close': {
        // TODO?
        break;
      }
      default: {
        const _: never = action;
        console.log('default');
        break;
      }
    }
  }

  /*
  МР открыт или переоткрыт. В этом случае нужно найти следующего ревьюера и уведомить его
  */
  async handleMergeRequestOpened(
    objectAttributes: MergeRequestAttributesDto,
  ): Promise<void> {
    console.log('handle opening mr');

    // TODO: при открытии МРа он может быть draft

    let nextReviewer: number | null = null;

    // при переоткытии МРа он может быть уже апрувнут
    if (objectAttributes.action === 'reopen') {
      nextReviewer =
        await this.gitlabUtils.getNextReviewerForMR(objectAttributes);
    } else {
      /**
       * Массив ревьюеров, в бесплатной версии гитлаба - 0 или 1 элемент.
       * Если когда-нибудь мы апгрейднем гитлаб, то эту часть надо будет переписать, возвращать массив ревьюеров.
       * Но пока что пофиг.
       */
      const reviewersIds = objectAttributes.reviewer_ids;
      nextReviewer = reviewersIds[0] || objectAttributes.assignee_id || null;
    }

    console.log('nextReviewer:');
    console.log(nextReviewer);

    if (nextReviewer === null) {
      return;
    }

    const tag = this.gitlabUserService.getDiscordTagsByUserIds(
      [nextReviewer],
      this.utils.isNowWorkingHours(),
    );

    const authorId = objectAttributes.author_id;
    const user = this.gitlabUserService.getUserById(authorId);
    const embedTitle = `${user.irlName} открыл${user.female ? 'а' : ''} МР`;

    let embedDescription = `Ревьюер: ${this.gitlabUserService.getUserNameById(nextReviewer)}\n`;
    embedDescription += `[!${objectAttributes.iid}: ${objectAttributes.title}](${objectAttributes.url})\n`;
    embedDescription += `\n${this.gitlabUtils.parseMergeRequestDescription(objectAttributes.description)}\n`;

    embedDescription += this.gitlabUtils.addDefaultFooter({
      repo: objectAttributes.target.name,
    });

    const notification: DiscordNotificationType = {
      notificationTitle: `МР! ${tag}`,
      embedTitle,
      embedDescription,
      embedUrl: objectAttributes.url,
      embedColor: this.gitlabUtils.gitlabColor,
      avatarURL: this.gitlabUtils.gitlabLogo,
      username: this.gitlabUtils.gitlabBotName,
    };

    this.discordNotificationService.sendNotification(notification);
    return;
  }

  handleMergeRequestApproved() {
    console.log('handle mr approved');
  }

  handleMergeRequestUpdated() {
    console.log('handle mr update');
  }
}
