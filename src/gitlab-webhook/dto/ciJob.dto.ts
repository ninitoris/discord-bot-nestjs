import { GitlabUserDto } from '@src/gitlab-webhook/dto/gitlabUser.dto';

export class CiJobDto {
  /** Уникальный номер джобы */
  id: number;
  /** Стейдж в пайплайне */
  stage: string;
  /** Название джобы */
  name: string;
  /** Статус джобы */
  status: string;

  created_at: string;
  started_at: string;
  finished_at: string;
  duration: number;
  queued_duration: number;

  /** Причина падения пайплайна. СМ. https://docs.gitlab.com/ee/ci/yaml/#retrywhen */
  failure_reason: string;

  /** https://docs.gitlab.com/ee/ci/yaml/#when */
  when: 'on_success';

  /** Джоба запущена вручную */
  manual: true;

  /** Если true, то при падении джоба не будет ронять пайплайн */
  allow_failure: boolean;

  /** Пользователь, кто стригерил старт пайплайна */
  'user': GitlabUserDto;

  'runner': {
    id: number;
    description: string;
    runner_type: string;
    active: boolean;
    is_shared: boolean;
    tags: Array<string>;
  };
  'artifacts_file': {
    filename: any;
    size: any;
  };
  'environment': any;
}
