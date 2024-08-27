import { CiJobDto } from '@src/gitlab-webhook/dto/pipeline/ciJob.dto';
import { GitlabUserDto } from '@src/gitlab-webhook/dto/gitlabUser.dto';

import { WebhookType } from '@src/gitlab-webhook/gitlab-webhook.types';
import { pipelineAttributesDto } from '@src/gitlab-webhook/dto/pipeline/pipelineAttributes.dto';

export class PipelineWebhookBodyDto {
  readonly object_kind: WebhookType;
  readonly user: GitlabUserDto;
  readonly project: {
    /** Название репы */
    name: string;

    [key: string]: any;
  };

  readonly object_attributes: pipelineAttributesDto;

  readonly builds: CiJobDto[];
}
