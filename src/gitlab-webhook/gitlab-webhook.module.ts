import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { GitlabWebhookController } from './gitlab-webhook.controller';
import { GitlabWebhookService } from './gitlab-webhook.service';
import { GitlabMiddleware } from './middleware/gitlab.middleware';
import { MergeRequestService } from './services/merge-request.service';
import { GitLabApiMobule } from '../gitlab-api/gitlab-api.module';
import { GitlabUtilityService } from '@src/gitlab-webhook/gitlab-utility.service';
import { GitLabUserService } from './services/gitlab-user.service';
import { UtilsModule } from '@src/utils/utils.module';
import { PipelineService } from '@src/gitlab-webhook/services/pipeline.service';
import { NoteService } from '@src/gitlab-webhook/services/note.service';
import { NotificationService } from '@src/notification-service/notification-service';
import { DiscordNotificationStrategy } from '@src/notification-service/discord/discord-notifications';
import { TelegramNotificationStrategy } from '@src/notification-service/telegram/telegram-notifications';

/* 
Модуль отвечает за обработку всех входящих вебхуков.
При необходимости формирует уведомление и отдает его в discord notification модуль
*/
@Module({
  imports: [GitLabApiMobule, UtilsModule],
  controllers: [GitlabWebhookController],
  providers: [
    GitlabWebhookService,
    MergeRequestService,
    PipelineService,
    NoteService,
    GitlabUtilityService,
    GitLabUserService,
    NotificationService,
    DiscordNotificationStrategy,
    TelegramNotificationStrategy,
  ],
})
export class GitlabWebhookModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(GitlabMiddleware).forRoutes({
      path: 'gitlab',
      method: RequestMethod.ALL,
    });
  }
}
