import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GitlabModule } from './gitlab/gitlab.module';

@Module({
  imports: [GitlabModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
