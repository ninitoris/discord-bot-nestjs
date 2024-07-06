import { Injectable } from '@nestjs/common';
import { GitLabApiService } from '@src/gitlab-api/gitlab.api.service';
import { MergeRequestAttributesDto } from '@src/gitlab-webhook/dto/mergeRequestAttributes.dto';
import { ApproversType } from '@src/gitlab-webhook/gitlab-webhook.types';

@Injectable()
export class GitlabUtilityService {
  constructor(private readonly gitlabApiService: GitLabApiService) {}

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
}
