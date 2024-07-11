import { Timestamp } from 'rxjs';

export class MergeRequestAttributesDto {
  // базовая инфа об МРе
  /**Название МРа */
  readonly title: string;
  /**Текст описания МРа */
  readonly description: string;
  /**ID юзера, который открыл МР */
  readonly author_id: number;
  /**Draft: или нет */
  readonly draft: boolean;

  /** Номер МРа в проекте */
  readonly iid: number;
  /**?Скорее всего сквозная нумерация всех МРов */
  readonly id: number; //
  /**Ссылка на МР */
  readonly url: string; //

  readonly action: 'open' | 'reopen' | 'approved' | 'update' | 'close';

  readonly assignee_ids: Array<number>;
  readonly reviewer_ids: Array<number>;
  readonly assignee_id: number; //        по идее ассайни можно вытаскивать отсюда

  readonly created_at: Timestamp<string>;
  readonly last_edited_at: any;
  readonly last_edited_by_id: any;

  readonly merge_error: any;
  readonly merge_params: any;
  readonly merge_status: any;
  readonly merge_user_id: any;
  readonly merge_when_pipeline_succeeds: any;

  readonly milestone_id: any;
  readonly source_branch: any;
  readonly source_project_id: any;
  readonly state_id: any;
  readonly target_branch: any;
  readonly target_project_id: any;
  readonly time_estimate: any;
  readonly updated_at: any;
  readonly updated_by_id: any;

  /** Репа в которую открыли МР */
  readonly target: {
    name: string;
  };
  // readonly source: object; // репа из которой открыли МР
  // readonly last_commit: object; // объект последнего коммита

  readonly work_in_progress: any;

  readonly labels: any;
  readonly state: any;
  readonly blocking_discussions_resolved: any;
  readonly first_contribution: any;
  readonly detailed_merge_status: any;
}
