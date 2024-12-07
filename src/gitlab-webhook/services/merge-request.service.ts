import { Injectable } from '@nestjs/common';
import { MergeRequestAttributesDto } from '../dto/mergeRequest/mergeRequestAttributes.dto';
import { MergeRequestWebhookBodyDto } from '../dto/mergeRequest/mergeRequestWebhookBody.dto';
import { GitLabApiService } from '@src/gitlab-api/gitlab-api.service';
import { GitlabUtilityService } from '@src/gitlab-webhook/gitlab-utility.service';
import { UtilsService } from '@src/utils/utils.service';
import { GitLabUserService } from '@src/gitlab-webhook/services/gitlab-user.service';
import { IApprovalsInfo } from '@src/gitlab-webhook/gitlab-webhook.types';
import { GitlabUserDto } from '@src/gitlab-webhook/dto/gitlabUser.dto';
import { MergeRequestChangesDto } from '@src/gitlab-webhook/dto/mergeRequest/mergeRequestChanges.dto';
import { NotificationService } from '@src/notification-service/notification-service';
import {
  GeneralNotificationType,
  TextWithURL,
} from '@src/notification-service/notification-strategy';

@Injectable()
export class MergeRequestService {
  constructor(
    private readonly gitlabApiService: GitLabApiService,
    private readonly gitlabUtils: GitlabUtilityService,
    private readonly notificationService: NotificationService,
    private readonly utils: UtilsService,
    private readonly gitlabUserService: GitLabUserService,
  ) {}

  // TODO: Validation pipe
  handleMergeRequest(body: MergeRequestWebhookBodyDto): void {
    // console.log('handling mr');
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
        const changes: MergeRequestChangesDto = body.changes;
        this.handleMergeRequestUpdated(objectAttributes, changes, user);
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
    // console.log('handle opening mr');

    // при открытии МРа он может быть draft
    const isDraft = objectAttributes.draft;
    if (isDraft) {
      return;
    }

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

    const authorId = objectAttributes.author_id;
    const user = await this.gitlabUserService.getUserById(authorId);
    const notificationDescription: TextWithURL = {
      text: `${user.irlName} открыл${user.female ? 'а' : ''} МР`,
      url: objectAttributes.url,
    };

    const additionalInfo: TextWithURL[] = [];
    if (nextReviewer) {
      additionalInfo.push({
        text: `Ревьюер: ${await this.gitlabUserService.getUserNameById(nextReviewer)}\n`,
      });
    } else {
      additionalInfo.push({
        text: `Ассайни: ${await this.gitlabUserService.getUserNameById(assignee)}\n`,
      });
    }

    additionalInfo.push(
      this.gitlabUtils.addMergeRequestTextAndLink(objectAttributes),
      {
        text: this.gitlabUtils.addMergeRequestDescription(objectAttributes),
      },
      {
        text: this.gitlabUtils.addDefaultFooter({
          repo: objectAttributes.target.name,
        }),
      },
    );

    const notification: GeneralNotificationType = {
      notificationTitle: `МР!`,
      notificationDescription,
      additionalInfo,
      notifyUsersIDs: [nextReviewer || assignee],
    };

    this.notificationService.sendNotification(notification);
    return;
  }

  async handleMergeRequestApproved(
    objectAttributes: MergeRequestAttributesDto,
    gitlabUser: GitlabUserDto,
  ): Promise<void> {
    const isDraft = objectAttributes.draft;
    if (isDraft) {
      return;
    }

    const reviewes = objectAttributes.reviewer_ids;
    console.log(reviewes);
    console.log(gitlabUser);
    // если МР апрувнут НЕ ревьюером, то уведомление не надо отправлять
    if (!reviewes.includes(gitlabUser.id)) {
      return;
    }

    // если МР апрувнут ревьюером, то проверяем, кто ассайни и отправляем ему уведомление (?)
    const nextReviewer =
      await this.gitlabUtils.getNextReviewerOrAssigneeForMR(objectAttributes);

    if (!nextReviewer) return;

    const user = await this.gitlabUserService.getUserById(gitlabUser.id);
    const nextReviewerUserName =
      await this.gitlabUserService.getUserNameById(nextReviewer);
    const notificationDescription: TextWithURL = {
      text: `${user.irlName} апрувнул${user.female ? 'а' : ''} МР`,
      url: objectAttributes.url,
    };

    // опять же делаем поправку на бесплатный гитлаб. в платном мог бы быть еще один ревьюер, но тут далее идет только ассайни
    const additionalInfo: TextWithURL[] = [
      {
        text: `Асайни: ${nextReviewerUserName}\n`,
      },
      this.gitlabUtils.addMergeRequestTextAndLink(objectAttributes),
      {
        text: this.gitlabUtils.addMergeRequestDescription(objectAttributes),
      },
      {
        text: this.gitlabUtils.addDefaultFooter({
          repo: objectAttributes.target.name,
          lastUpdateTime: objectAttributes.updated_at,
        }),
      },
    ];

    const notification: GeneralNotificationType = {
      notificationTitle: `МР!`,
      notificationDescription,
      additionalInfo,
      notifyUsersIDs: [nextReviewer],
    };
    this.notificationService.sendNotification(notification);
    return;
  }

  private async handleReviewerChanged(
    objectAttributes: MergeRequestAttributesDto,
    changes: MergeRequestChangesDto,
    gitlabUser: GitlabUserDto,
  ): Promise<boolean | void> {
    const newReviewer: GitlabUserDto = changes.reviewers.current[0];
    const newReviewerId = newReviewer.id;
    let approvalsInfo: IApprovalsInfo;
    try {
      approvalsInfo = await this.gitlabApiService.getMergeRequestApprovalsInfo(
        objectAttributes.target_project_id,
        objectAttributes.iid,
      );
    } catch (error) {
      console.log(error);
      return;
    }

    const checkNewReviewer = this.gitlabUtils.getReviewerWhoDidNotApprove(
      [newReviewerId],
      approvalsInfo,
    );

    // проверить, что этот ревьюер еще не аппрувнул
    if (checkNewReviewer) {
      const user = await this.gitlabUserService.getUserById(gitlabUser.id);
      const newReviewerUserName =
        await this.gitlabUserService.getUserNameById(checkNewReviewer);

      const notificationDescription: TextWithURL = {
        text: `${user.irlName} изменил${user.female ? 'а' : ''} ревьюера`,
        url: objectAttributes.url,
      };

      const additionalInfo: TextWithURL[] = [
        {
          text: `Новый ревьюер: ${newReviewerUserName}\n`,
        },
        this.gitlabUtils.addMergeRequestTextAndLink(objectAttributes),
        {
          text: this.gitlabUtils.addMergeRequestDescription(objectAttributes),
        },
        {
          text: this.gitlabUtils.addDefaultFooter({
            repo: objectAttributes.target.name,
          }),
        },
      ];

      const notification: GeneralNotificationType = {
        notificationTitle: `МР!`,
        notificationDescription,
        additionalInfo,
        notifyUsersIDs: [checkNewReviewer],
      };
      this.notificationService.sendNotification(notification);
      return true;
    }
  }

  private async handleAssigneeChanged(
    objectAttributes: MergeRequestAttributesDto,
    changes: MergeRequestChangesDto,
    gitlabUser: GitlabUserDto,
  ) {
    const newAssignee: GitlabUserDto = changes.assignees.current[0];
    const newAssigneeId = newAssignee.id;
    const user = await this.gitlabUserService.getUserById(gitlabUser.id);

    const newAssigneeUserName =
      await this.gitlabUserService.getUserNameById(newAssigneeId);

    const notificationDescription: TextWithURL = {
      text: `${user.irlName} изменил${user.female ? 'а' : ''} ассайни`,
      url: objectAttributes.url,
    };

    const additionalInfo: TextWithURL[] = [
      {
        text: `Новый ассайни: ${newAssigneeUserName}\n`,
      },
      this.gitlabUtils.addMergeRequestTextAndLink(objectAttributes),
      {
        text: this.gitlabUtils.addMergeRequestDescription(objectAttributes),
      },
      {
        text: this.gitlabUtils.addDefaultFooter({
          repo: objectAttributes.target.name,
        }),
      },
    ];

    const notification: GeneralNotificationType = {
      notificationTitle: `МР!`,
      notificationDescription,
      additionalInfo,
      notifyUsersIDs: [newAssigneeId],
    };
    return this.notificationService.sendNotification(notification);
  }

  private async handleDraftChange(
    objectAttributes: MergeRequestAttributesDto,
    changes: MergeRequestChangesDto,
    gitlabUser: GitlabUserDto,
  ) {
    if (changes.draft.current !== false) return;

    // draft.current === false -> marked mr as ready
    const assignee = objectAttributes.assignee_id;
    let approvalsInfo: IApprovalsInfo;

    try {
      approvalsInfo = await this.gitlabApiService.getMergeRequestApprovalsInfo(
        objectAttributes.target_project_id,
        objectAttributes.iid,
      );
    } catch (error) {
      console.log(error);
      return;
    }
    const nextReviewer = this.gitlabUtils.getReviewerWhoDidNotApprove(
      objectAttributes.reviewer_ids,
      approvalsInfo,
    );

    if (!nextReviewer && !assignee) {
      return;
    }

    const user = await this.gitlabUserService.getUserById(gitlabUser.id);
    const notificationDescription: TextWithURL = {
      text: `${user.irlName} пометил${user.female ? 'а' : ''} МР как готовый`,
      url: objectAttributes.url,
    };

    const additionalInfo: TextWithURL[] = [];
    if (nextReviewer) {
      additionalInfo.push({
        text: `Ревьюер: ${await this.gitlabUserService.getUserNameById(nextReviewer)}\n`,
      });
    } else {
      additionalInfo.push({
        text: `Ассайни: ${await this.gitlabUserService.getUserNameById(assignee)}\n`,
      });
    }
    additionalInfo.push(
      this.gitlabUtils.addMergeRequestTextAndLink(objectAttributes),
      {
        text: this.gitlabUtils.addMergeRequestDescription(objectAttributes),
      },
      {
        text: this.gitlabUtils.addDefaultFooter({
          repo: objectAttributes.target.name,
        }),
      },
    );

    const notification: GeneralNotificationType = {
      notificationTitle: `МР!`,
      notificationDescription,
      additionalInfo,
      notifyUsersIDs: [nextReviewer || assignee],
    };

    return this.notificationService.sendNotification(notification);
  }

  async handleMergeRequestUpdated(
    objectAttributes: MergeRequestAttributesDto,
    changes: MergeRequestChangesDto,
    gitlabUser: GitlabUserDto,
  ) {
    const isDraft = objectAttributes.draft;
    if (isDraft) {
      return;
    }

    // изменен ревьюер
    if (changes.reviewers && changes.reviewers.current.length) {
      const notificationSent = this.handleReviewerChanged(
        objectAttributes,
        changes,
        gitlabUser,
      );
      // если новый ревьюер еще не апрувнул, то отправили ему уведомление и выходим из функции
      if (notificationSent) return;
      // если новый ревьюер уже апрувнул, то идем дальше
    }

    // изменен ассайни
    if (changes.assignees && changes.assignees.current.length) {
      return this.handleAssigneeChanged(objectAttributes, changes, gitlabUser);
    }

    // пометили мр либо как draft либо как ready
    if (changes.draft) {
      return this.handleDraftChange(objectAttributes, changes, gitlabUser);
    }

    // других обработок нет
    return;
  }
}
