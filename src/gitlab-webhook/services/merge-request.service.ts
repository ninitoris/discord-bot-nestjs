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
import { IApprovalsInfo } from '@src/gitlab-webhook/gitlab-webhook.types';
import { GitlabUserDto } from '@src/gitlab-webhook/dto/gitlabUser.dto';

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
    const user: GitlabUserDto = body.user;
    const action = objectAttributes.action;

    switch (action) {
      case 'open':
      case 'reopen': {
        this.handleMergeRequestOpened(objectAttributes);
        break;
      }
      case 'approved': {
        this.handleMergeRequestApproved(objectAttributes, user);
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
    const assignee = objectAttributes.assignee_id;

    // при переоткытии МРа он может быть уже апрувнут
    if (objectAttributes.action === 'reopen') {
      let approvalsInfo: IApprovalsInfo;
      try {
        approvalsInfo =
          await this.gitlabApiService.getMergeRequestApprovalsInfo(
            objectAttributes.target_project_id,
            objectAttributes.iid,
          );
      } catch (error) {
        console.log(error);
        return;
      }
      nextReviewer = this.gitlabUtils.getReviewerWhoDidNotApprove(
        objectAttributes.reviewer_ids,
        approvalsInfo,
      );
    } else {
      /**
       * Массив ревьюеров, в бесплатной версии гитлаба - 0 или 1 элемент.
       * Если когда-нибудь мы апгрейднем гитлаб, то эту часть надо будет переписать, возвращать массив ревьюеров.
       * Но пока что пофиг.
       */
      const reviewersIds = objectAttributes.reviewer_ids;
      nextReviewer = reviewersIds[0];
    }

    if (!nextReviewer && !assignee) {
      return;
    }

    const tag = this.gitlabUserService.getDiscordTagsByUserIds(
      [nextReviewer || assignee],
      this.utils.isNowWorkingHours(),
    );

    const authorId = objectAttributes.author_id;
    const user = this.gitlabUserService.getUserById(authorId);
    const embedTitle = `${user.irlName} открыл${user.female ? 'а' : ''} МР`;

    let embedDescription = '';
    if (nextReviewer) {
      embedDescription += `Ревьюер: ${this.gitlabUserService.getUserNameById(nextReviewer)}\n`;
    } else {
      `Ассайни: ${this.gitlabUserService.getUserNameById(assignee)}\n`;
    }
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

  async handleMergeRequestApproved(
    objectAttributes: MergeRequestAttributesDto,
    user: GitlabUserDto,
  ): Promise<void> {
    const reviewes = objectAttributes.reviewer_ids;
    console.log(reviewes);
    console.log(user);
    // если МР апрувнут НЕ ревьюером, то уведомление не надо отправлять
    if (!reviewes.includes(user.id)) {
      return;
    }

    // если МР апрувнут ревьюером, то проверяем, кто ассайни и отправляем ему уведомление (?)
    const nextReviewer =
      await this.gitlabUtils.getNextReviewerOrAssigneeForMR(objectAttributes);

    if (!nextReviewer) return;
  }

  handleMergeRequestUpdated() {
    console.log('handle mr update');
  }
}
