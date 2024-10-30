import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entities/users.entity';
import { UserService } from './user.service';
import { GitLabApiModule } from '../gitlab-api/gitlab-api.module';
import { UserController } from './user.controller';
import { UserSettings } from './entities/usersettings.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Users, UserSettings]), GitLabApiModule],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
