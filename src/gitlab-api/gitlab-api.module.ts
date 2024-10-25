import { Module } from '@nestjs/common';
import { GitLabApiService } from './gitlab-api.service';

/*
Модуль предоставляет ручки для api гитлаба, 
используется webhook модулем в случае, если информации в вебхуке недостаточно
*/

@Module({
  imports: [],
  controllers: [],
  providers: [GitLabApiService],
  exports: [GitLabApiService],
})
export class GitLabApiModule {}
