import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MergeRequestAttributesDto } from './mergeRequestAttributes.dto';
import { GitlabUserDto } from '@src/gitlab-webhook/dto/gitlabUser.dto';

export class MergeRequestDto {
  readonly object_kind: any;
  readonly event_type: any;
  readonly user: GitlabUserDto;
  readonly project: any;

  @Type(() => MergeRequestAttributesDto)
  @ValidateNested()
  readonly object_attributes: MergeRequestAttributesDto;

  readonly labels: any;
  readonly changes: any;
  readonly repository: any;

  // в этих полях не много смысла, так как у нас есть assignee_ids, reviewer_ids и assignee_id в атрибутах (object_attributes)
  readonly assignees: Array<any>; // массив с ассайни, у нас там всегда будет один человек
  readonly reviewers: Array<any>; // массив с ревьюерами, но в бесплатной версии Гитлаба нельзя поставить больше одного ревьюера
}
