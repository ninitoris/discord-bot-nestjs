import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entities/users.entity';
import { UserService } from './user.service';
import { GitLabApiModule } from '../gitlab-api/gitlab-api.module';
import { UserController } from './user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Users]), GitLabApiModule],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
