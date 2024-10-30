import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entities/users.entity';
import { Repository } from 'typeorm';
import { GitLabApiService } from '../gitlab-api/gitlab-api.service';
import { UserSettings } from './entities/usersettings.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Users) private readonly userRepository: Repository<Users>,
    @InjectRepository(UserSettings)
    private readonly userSettingsRepository: Repository<UserSettings>, // Добавьте репозиторий для UserSettings
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
      name: userInfo?.name,
      gitlabID: userInfo?.id,
      gitlabName: userInfo?.username.toLowerCase(),
      telegramID: createUserDto?.telegramID,
      telegramUsername: createUserDto?.telegramUsername,
      orgID: createUserDto?.orgID,
      createdBy: createUserDto?.createdBy,
    });

    const userSettings = new UserSettings();
    userSettings.user = newUser;
    if (createUserDto.settings) {
      userSettings.useTelegram = createUserDto.settings.useTelegram ?? false;
      userSettings.useDiscord = createUserDto.settings.useDiscord ?? false;
      userSettings.tgGroupChatNotify =
        createUserDto.settings.tgGroupChatNotify ?? false;
      userSettings.tgPrivateMessageNotify =
        createUserDto.settings.tgPrivateMessageNotify ?? false;
    }

    await this.userSettingsRepository.save(userSettings);

    return { newUser };
  }

  async findByTelegram(telegramID: number): Promise<Users | HttpException> {
    const user = await this.userRepository.findOne({ where: { telegramID } });

    if (!user) throw new HttpException('User Not Found', 404);

    return user;
  }

  async findByGitlabName(gitlabName: string): Promise<Users | HttpException> {
    const user = await this.userRepository.findOne({ where: { gitlabName } });

    if (!user) throw new HttpException('User Not Found', 404);

    return user;
  }

  async getAllUsers(): Promise<Users[] | HttpException> {
    const users = await this.userRepository.find();

    if (!users) throw new HttpException('Users Not Found', 404);

    return users;
  }
}
