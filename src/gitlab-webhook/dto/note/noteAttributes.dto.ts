export class NoteAttributesDto {
  attachment: any;
  author_id: number;
  commit_id: any;
  created_at: string;
  discussion_id: string;
  id: number;
  line_code: any;

  // не уверен, что из этого отвечает за контент note-а, он попадает и туда и туда
  note: string;
  description: string;

  noteable_id: number;

  noteable_type: 'Issue' | 'MergeRequest' | string;

  // три гига объекта, которые описывают, где в коде находится строка, на которой написали note.
  // решил не описывать
  change_position: any;
  original_position: any;
  position: any;

  project_id: number;
  resolved_at: any;
  resolved_by_id: any;
  resolved_by_push: any;
  st_diff: any;
  system: any;
  type: any;
  updated_at: string;
  updated_by_id: any;

  /** Ссылка на note */
  url: string;

  action: 'create' | any;
}
