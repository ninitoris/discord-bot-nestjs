import { Injectable } from '@nestjs/common';
import { WebhookType } from './gitlab-webhook.types';
import { MergeRequestService } from './services/merge-request.service';
import { PipelineService } from '@src/gitlab-webhook/services/pipeline.service';

@Injectable()
export class GitlabWebhookService {
  constructor(
    private readonly mergeRequestService: MergeRequestService,
    private readonly pipelineService: PipelineService,
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
}
