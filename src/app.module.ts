import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GitlabWebhookModule } from './gitlab-webhook/gitlab-webhook.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { ENVIRONMENT_KEY } from '@src/constants/env-keys';

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
        const isProduction = configService.get('NODE_ENV') === 'true';
        const isSyncEnable =
          isProduction &&
          configService.get(ENVIRONMENT_KEY.TYPEORM_FORCE) === 'true';
        const isLoggingEnable =
          configService.get(ENVIRONMENT_KEY.TYPEORM_LOGGING) === 'true';
        const isAutoLoadEntityEnabled =
          isProduction &&
          configService.get(ENVIRONMENT_KEY.TYPEORM_AUTO_LOAD_ENTITY) ===
            'true';

        return {
          logging: isLoggingEnable,
          type: 'postgres',
          host: configService.get(ENVIRONMENT_KEY.DB_HOST),
          port: parseInt(configService.get(ENVIRONMENT_KEY.DB_PORT), 10),
          username: configService.get(ENVIRONMENT_KEY.DB_USERNAME),
          password: configService.get(ENVIRONMENT_KEY.DB_PASSWORD),
          database: configService.get(ENVIRONMENT_KEY.DB_NAME),
          synchronize: isSyncEnable,
          autoLoadEntities: isAutoLoadEntityEnabled,
          entities: ['dist/**/*.entity{.ts,.js}'],
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
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
