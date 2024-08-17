import { Injectable } from '@nestjs/common';
import { GitLabApiService } from '@src/gitlab-api/gitlab-api.service';
import { MergeRequestAttributesDto } from '@src/gitlab-webhook/dto/mergeRequestAttributes.dto';
import { IApprovalsInfo } from '@src/gitlab-webhook/gitlab-webhook.types';
import { UtilsService } from '@src/utils/utils.service';

@Injectable()
export class GitlabUtilityService {
  constructor(
    private readonly gitlabApiService: GitLabApiService,
    private readonly utils: UtilsService,
  ) {}

  public readonly gitlabColor = 0xfc6d26;
  public readonly gitlabLogo =
    'https://static-00.iconduck.com/assets.00/gitlab-icon-2048x1885-1o0cwkbx.png';
  public readonly gitlabBotName = 'GitLab';
  public readonly defaultNotificationTemplate = {
    embedColor: this.gitlabColor,
    avatarURL: this.gitlabLogo,
    username: this.gitlabBotName,
  };

  /** Возвращает человека, от которого требуется следующее действие в МРе.
   * Если ревьюер еще не апрувнул, то это будет он.
   * Если ревьюера нет или он уже апрувнул, то это будет ассайни.
   * Иначе это null.
   *
   * NB! не работает (скорее всего) в платном гитлабе, где можно поставить несколько ревьюеров на один МР */
  async getNextReviewerOrAssigneeForMR(
    objectAttributes: MergeRequestAttributesDto,
  ): Promise<number> {
    let approvalsInfo: IApprovalsInfo | null = null;

    try {
      approvalsInfo = await this.gitlabApiService.getMergeRequestApprovalsInfo(
        objectAttributes.target_project_id,
        objectAttributes.iid,
      );
    } catch (error) {
      console.log(error);
      return null;
    }

    let nextReviewer: number | null = null;

    /** Массив ревьюеров, в бесплатной версии гитлаба - 0 или 1 элемент */
    const reviewersIds: Array<number> = objectAttributes.reviewer_ids;

    nextReviewer = this.getReviewerWhoDidNotApprove(
      reviewersIds,
      approvalsInfo,
    );

    if (!nextReviewer) {
      nextReviewer = objectAttributes.assignee_id || null;
    }

    return nextReviewer;
  }

  isApprovalsInfo = (p: IApprovalsInfo | Array<number>): p is IApprovalsInfo =>
    !Array.isArray(p);

  /** Найти ревьюера, который еще не аппрувнул МР. Если такого нет, то возвращает null */
  getReviewerWhoDidNotApprove(
    reviewersIds: Array<number>,
    approvalsIdsArray: Array<number>,
  ): number;
  getReviewerWhoDidNotApprove(
    reviewersIds: Array<number>,
    approvalsInfo: IApprovalsInfo,
  ): number;
  getReviewerWhoDidNotApprove(
    reviewersIds: Array<number>,
    approvalsInfo: IApprovalsInfo | Array<number>,
  ): number | null | undefined {
    if (!reviewersIds.length) {
      return null;
    }

    let reviewer = null;
    if (this.isApprovalsInfo(approvalsInfo)) {
      console.log('it IS approvals info');
      if (approvalsInfo?.approved) {
        // если кто-то апрувнул МР, то ищем ревьюера, который еще не апрувнул его
        const approvedByIds = approvalsInfo.approved_by.map((user) => {
          return user.user.id;
        });
        reviewer = reviewersIds.find((r) => !approvedByIds.includes(r));
      } else {
        reviewer = reviewersIds[0];
      }
    } else {
      // TODO: прошло 4 недели и я забыл, зачем добавил перегрузку с  Array<number>. Если вспомню, то доделать этот метод... ⚽️
    }
    return reviewer;
  }

  beautifyDescription(description: string) {
    return description
      .replaceAll(/\n{2,}/gm, '\n') // убрать все множественные переносы строк
      .trim()
      .replaceAll('```', '`'); // это чтобы код красивее выглядел
  }

  /** Если в описании есть "Краткое описание", то возвращает текст из него */
  private getMergeReuestShortDescription(
    description: string,
  ): string | undefined {
    const reg = /#+ Краткое описание:\n/;
    const foundStrings = description.split(reg);
    if (Array.isArray(foundStrings) && foundStrings[1]) {
      const shortDescription = foundStrings[1].split(/\n#{1,5} /);
      if (
        Array.isArray(shortDescription) &&
        shortDescription[0] &&
        shortDescription[0] !== foundStrings[1]
      ) {
        return this.beautifyDescription(shortDescription[0]) || undefined;
      }
    } else return undefined;
  }

  /** Возвращает либо краткое описание, либо текст из первого заголовка, либо исходную строку */
  public parseMergeRequestDescription(description: string) {
    const shortDescription = this.getMergeReuestShortDescription(description);
    if (shortDescription) return shortDescription;

    // Вот этот кусок легаси кода пытается вернуть текст из-под первого заголовка
    const reg = /[\n]?#+ [а-яА-ЯёËa-zA-Z: ]*\n/;
    const str = description.split(reg);
    return Array.isArray(str) && str[1]
      ? this.beautifyDescription(str[1])
      : description;
  }

  public addDefaultFooter({
    repo,
    lastUpdateTime,
  }: {
    repo: string;
    lastUpdateTime?: string;
  }) {
    let footer = '\n';
    if (lastUpdateTime) {
      footer += 'С последнего изменения прошло: ';
      footer += `${this.utils.getDatesDelta(lastUpdateTime, Date.now())}\n`;
    }
    footer += `Репа: ${repo}\n`;
    footer += `${this.utils.getDateNow()}`;

    return footer;
  }
}
