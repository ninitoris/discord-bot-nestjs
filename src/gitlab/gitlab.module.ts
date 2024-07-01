import { Module } from '@nestjs/common';
import { GitlabController } from './gitlab.controller';

@Module({
  controllers: [GitlabController],
})
export class GitlabModule {}
