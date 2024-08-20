import { GitlabUserDto } from '@src/gitlab-webhook/dto/gitlabUser.dto';

export class MergeRequestChangesDto {
  readonly assignees?: {
    previous: GitlabUserDto[];
    current: GitlabUserDto[];
  };

  readonly reviewers?: {
    previous: GitlabUserDto[];
    current: GitlabUserDto[];
  };
}
