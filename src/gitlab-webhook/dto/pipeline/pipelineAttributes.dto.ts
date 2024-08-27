export class pipelineAttributesDto {
  id: number;
  iid: number;
  name: any;
  ref: string | any;
  tag: boolean;
  sha: string;
  before_sha: string;

  /** https://docs.gitlab.com/ee/ci/jobs/job_rules.html#ci_pipeline_source-predefined-variable */
  source: string;

  status: string;

  detailed_status: 'running' | 'canceled' | 'passed' | 'pending' | 'failed';

  stages: Array<string>;
  created_at: string;
  finished_at: string;
  duration: number;
  queued_duration: number;
  variables: Array<any>;
  /** Ссылка на пайплайн */
  url: string;
}
