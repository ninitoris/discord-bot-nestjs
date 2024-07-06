import { GitlabUserDto } from '@src/gitlab-webhook/dto/gitlabUser.dto';

export type WebhookType = 'merge_request' | 'note' | 'pipeline' | 'build';

export type ApproversType = {
  approved: boolean;
  approved_by: Array<{ user: GitlabUserDto }>;
};
/*
type ProjectType = {
  id: number;
  name: string;
  description: string;
  web_url: string;
  avatar_url: string;
  git_ssh_url: string;
  git_http_url: string;
  namespace: string;
  visibility_level: number | any;
  path_with_namespace: string;
  default_branch: string;
  ci_config_path: null | any;
  homepage: string;
  url: string;
  ssh_url: string;
  http_url: string;
};
*/
