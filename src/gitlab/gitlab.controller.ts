import { Controller, Get, Post, RawBodyRequest, Req } from '@nestjs/common';

@Controller('gitlab')
export class GitlabController {
  constructor() {}

  @Get()
  getGitlab() {
    return 'I am gitlab';
  }

  @Post()
  postGitlab(@Req() req: RawBodyRequest<Request>) {
    const body = req.body;
    return body;
  }
}
