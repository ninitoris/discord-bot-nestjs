import { Injectable } from '@nestjs/common';

type WebhookType = 'pipeline' | 'merge_request' | 'note';

@Injectable()
export class GitlabService {
  constructor() {}

  handleGitlabRequest(type: WebhookType): any {
    switch (type) {
      case 'merge_request': {
        break;
      }
      case 'pipeline': {
        break;
      }
      case 'note': {
        break;
      }
      default: {
        const unknownType: never = type; // Для ошибки сборки при добавлении нового типа
        throw new Error('Unknown webhook type: ' + unknownType);
      }
    }
  }
}
