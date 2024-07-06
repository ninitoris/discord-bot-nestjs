import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GitlabWebhookModule } from './gitlab-webhook/gitlab-webhook.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    GitlabWebhookModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
