import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GitlabWebhookModule } from './gitlab-webhook/gitlab-webhook.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { ENVIRONMENT_KEY } from '@src/constants/env-keys';
import { dataSourceOptions } from '@src/database/data-source';

@Module({
  imports: [
    GitlabWebhookModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        const isAutoLoadEntityEnabled =
          isProduction &&
          configService.get(ENVIRONMENT_KEY.TYPEORM_AUTO_LOAD_ENTITY) ===
            'true';

        return {
          autoLoadEntities: isAutoLoadEntityEnabled,
          ...dataSourceOptions,
        };
      },
      inject: [ConfigService],
    }),
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
