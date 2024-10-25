import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entities/users.entity';
import { Repository } from 'typeorm';
import { GitLabApiService } from '../gitlab-api/gitlab-api.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Users) private readonly userRepository: Repository<Users>,
    private readonly gitlabApi: GitLabApiService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    const userInfo = await this.gitlabApi.getUserInfo(createUserDto.gitlabName);
    const isExist = await this.userRepository.findOne({
      where: {
        telegramID: createUserDto.telegramID,
        name: userInfo.name.toLowerCase(),
      },
    });

    if (isExist)
      throw new BadRequestException('Пользователь уже зарегестрирован');

    const newUser = await this.userRepository.save({
      name: String(userInfo.name),
      orgID: 'IPC',
      gitlabID: userInfo.id,
      discordID: null,
      gitlabName: String(userInfo.username).toLowerCase(),
      telegramID: createUserDto.telegramID,
    });

    return { newUser };
  }

  async findByTgID(telegramID: number) {
    const user = await this.userRepository.findOne({
      where: {
        telegramID,
      },
    });
    if (!user) return null;

    return user;
  }

  async findByGitlabName(gitlabName: string) {
    const user = await this.userRepository.findOne({
      where: {
        gitlabName,
      },
    });
    if (!user) return null;

    return user;
  }
}
