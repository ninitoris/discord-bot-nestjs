import { UserInfo } from '@src/gitlab-webhook/gitlab-webhook.types';

export class GitlabUserDto implements UserInfo {
  readonly id: number;
  readonly username: string;
  readonly name: string;
  readonly state: string;
  readonly locked: boolean;
  readonly avatar_url: string;
  readonly web_url: string;
}
