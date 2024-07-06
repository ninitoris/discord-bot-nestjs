import { Module } from '@nestjs/common';
import { GitLabApiService } from './gitlab.api.service';

@Module({
  imports: [],
  controllers: [],
  providers: [GitLabApiService],
  exports: [GitLabApiService],
})
export class GitLabApiMobule {}
