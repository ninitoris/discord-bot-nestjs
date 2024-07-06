import { Injectable } from '@nestjs/common';
import { WebhookType } from './gitlab-webhook.types';
import { MergeRequestService } from './services/merge-request.service';

@Injectable()
export class GitlabWebhookService {
  constructor(private readonly mergeRequestServive: MergeRequestService) {}

  handleGitlabRequest(body: any): void {
    const type: WebhookType = body.object_kind;
    switch (type) {
      case 'merge_request': {
        this.mergeRequestServive.handleMergeRequest(body);
        break;
      }
      case 'pipeline': {
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
