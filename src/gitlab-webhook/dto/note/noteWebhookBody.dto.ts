import { GitlabUserDto } from '@src/gitlab-webhook/dto/gitlabUser.dto';
import { MergeRequestAttributesDto } from '@src/gitlab-webhook/dto/mergeRequest/mergeRequestAttributes.dto';
import { NoteAttributesDto } from '@src/gitlab-webhook/dto/note/noteAttributes.dto';

export class NoteWebhookBodyDto {
  object_kind: 'note';
  event_type: 'note';
  user: GitlabUserDto;
  project_id: number;
  project: any;
  object_attributes: NoteAttributesDto;

  /** Репа, в которой написали note */
  repository: any;

  /** Ишью, к которому написали note */
  issue?: any;

  /** МР, к которому написали note */
  merge_request?: MergeRequestAttributesDto;

  // не знаю куда еще можно написать note, пока что не обрабатываем больше ничего
}
