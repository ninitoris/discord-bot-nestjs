import { Injectable } from '@nestjs/common';
import { GitLabApiService } from '@src/gitlab-api/gitlab-api.service';
import { MergeRequestAttributesDto } from '@src/gitlab-webhook/dto/mergeRequestAttributes.dto';
import { ApproversType } from '@src/gitlab-webhook/gitlab-webhook.types';
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

  async getNextReviewerForMR(
    objectAttributes: MergeRequestAttributesDto,
  ): Promise<number | null> {
    let approvals: ApproversType | null = null;

    try {
      approvals = await this.gitlabApiService.getMergeRequestApprovals(
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

    if (reviewersIds.length) {
      if (approvals?.approved) {
        // если кто-то апрувнул МР, то ищем ревьюера, который еще не апрувнул его
        const approvedByIds = approvals.approved_by.map((user) => {
          return user.user.id;
        });
        nextReviewer = reviewersIds.find((r) => !approvedByIds.includes(r));
      } else {
        nextReviewer = reviewersIds[0];
      }
    }

    if (!nextReviewer) {
      nextReviewer = objectAttributes.assignee_id || null;
    }

    return nextReviewer;
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
