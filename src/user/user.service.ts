import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreateUserDto,
  GetUserByGlDto,
  GetUserByTgDto,
} from './create-user.dto';
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
    if (!userInfo) {
      throw new BadRequestException(`${createUserDto.gitlabName} не найден`);
    }

    const isExist = await this.userRepository.findOne({
      where: {
        name: userInfo?.name,
      },
    });

    if (isExist)
      throw new BadRequestException('Пользователь уже зарегестрирован');

    const newUser = await this.userRepository.save({
      name: String(userInfo?.name),
      gitlabID: userInfo?.id,
      gitlabName: String(userInfo?.username).toLowerCase(),
      telegramID: createUserDto?.telegramID,
    });

    return { newUser };
  }

  async findByTgID(getUserByTgDto: GetUserByTgDto): Promise<Users | undefined> {
    const user = await this.userRepository.findOne({
      where: {
        telegramID: getUserByTgDto.telegramID,
      },
    });
    if (!user) return undefined;

    return user;
  }

  async findByGitlabName(
    getUserByGlDto: GetUserByGlDto,
  ): Promise<Users | undefined> {
    const user = await this.userRepository.findOne({
      where: {
        gitlabName: getUserByGlDto.gitlabName,
      },
    });
    if (!user) return undefined;

    return user;
  }
}
