import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { GitlabWebhookController } from './gitlab-webhook.controller';
import { GitlabWebhookService } from './gitlab-webhook.service';
import { GitlabMiddleware } from './middleware/gitlab.middleware';
import { MergeRequestService } from './services/merge-request.service';
import { GitLabApiMobule } from '../gitlab-api/gitlab.api.module';
import { GitlabUtilityService } from '@src/gitlab-webhook/gitlab-utility.service';

@Module({
  imports: [GitLabApiMobule],
  controllers: [GitlabWebhookController],
  providers: [GitlabWebhookService, MergeRequestService, GitlabUtilityService],
})
export class GitlabWebhookModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(GitlabMiddleware).forRoutes({
      path: 'gitlab',
      method: RequestMethod.ALL,
    });
  }
}
