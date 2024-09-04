import { Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { GitlabWebhookService } from './gitlab-webhook.service';

@Controller('gitlab')
export class GitlabWebhookController {
  constructor(private readonly gitlabService: GitlabWebhookService) {}

  @Post()
  postGitlab(@Req() req: Request) {
    const body = req.body;
    this.gitlabService.handleGitlabRequest(body);
  }

  @Post('deploy')
  apiHandler(@Req() req: Request) {
    const body = req.body;
    this.gitlabService.sendStageDeployNotification(body);
  }
}
