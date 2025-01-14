import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entities/users.entity';
import { Repository } from 'typeorm';
import { GitLabApiService } from '../gitlab-api/gitlab-api.service';
import { UserSettings } from './entities/usersettings.entity';
import { RegistrationRequest } from '@src/user/entities/registration-request.entity';
import { RegisterData } from '@src/telegram-bot/types/telegram-bot-types';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Users) private readonly userRepository: Repository<Users>,
    @InjectRepository(UserSettings)
    private readonly userSettingsRepository: Repository<UserSettings>, // Добавьте репозиторий для UserSettings
    private readonly gitlabApi: GitLabApiService,
    @InjectRepository(RegistrationRequest)
    private readonly registrationRepository: Repository<RegistrationRequest>,
    private readonly gitlabApiService: GitLabApiService,
  ) {}

  private readonly dummyUser: Partial<Users> = {
    name: 'кто-то',
  };

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
      name: createUserDto?.name,
      gitlabID: userInfo?.id,
      gitlabName: userInfo?.username.toLowerCase(),
      telegramID: createUserDto?.telegramID,
      telegramUsername: createUserDto?.telegramUsername,
      orgID: createUserDto?.orgID,
      female: createUserDto.female,
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

  async saveUser(user: Users): Promise<Users> {
    return await this.userRepository.save(user);
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

  async createRegistrationRequest(registerData: RegisterData) {
    const exitstingRequest = await this.registrationRepository.findOne({
      where: {
        gitlabName: registerData.gitlabName,
        status: 'NEW',
      },
    });

    if (exitstingRequest) {
      throw new BadRequestException(
        'Заявка на регистрацию этого юзера уже существует',
      );
    }

    const rr = new RegistrationRequest();

    rr.status = 'NEW';
    rr.name = registerData.name;
    rr.female = registerData.female;
    rr.orgID = registerData.orgID;
    rr.gitlabName = registerData.gitlabName;
    rr.gitlabID = registerData.gitlabID;
    rr.discordName = registerData.discordName ?? null;
    rr.telegramID = registerData.telegramID ?? null;
    rr.telegramUsername = registerData.telegramUsername ?? null;
    rr.createdBy = registerData.createdBy;
    rr.createdAt = new Date();

    const newRequest = await this.registrationRepository.save(rr);

    return newRequest;
  }

  async saveRegistrationRequest(registrationRequest: RegistrationRequest) {
    return await this.registrationRepository.save([registrationRequest]);
  }

  // заявка на регистрацию связывается с сообщением в телеге по id сообщения //TODO: вероятно что для разных чатов нумерация сообщений будет разная.
  async getRegistrationRequestByMessageID(
    messageID: number,
  ): Promise<RegistrationRequest> {
    return await this.registrationRepository.findOne({
      where: {
        messageID: messageID,
      },
    });
  }

  async registrationRequestExists(tgID: number): Promise<boolean> {
    return await this.registrationRepository.existsBy({
      telegramID: tgID,
      status: 'NEW',
    });
  }

  async userExists(telegramID: number): Promise<boolean> {
    const res = await this.userRepository.exists({
      where: {
        telegramID: telegramID,
      },
    });
    return res;
  }

  async getUserByTgID(
    tgID: number,
    options: { getNotificationSettings: boolean } = {
      getNotificationSettings: false,
    },
  ) {
    return await this.userRepository.findOne({
      where: {
        telegramID: tgID,
      },
      relations: options.getNotificationSettings
        ? { userSettings: true }
        : undefined,
    });
  }

  /** Возвращает либо пользователя GitLab по указанному ID, либо пользователя-заглушку */
  async getUserByGitlabID(
    gitlabUserID: number,
    options: { getNotificationSettings: boolean } = {
      getNotificationSettings: false,
    },
  ): Promise<Users | Partial<Users>> {
    const user: Users = await this.userRepository.findOne({
      where: {
        gitlabID: gitlabUserID,
      },
      relations: options.getNotificationSettings
        ? { userSettings: true }
        : undefined,
    });

    if (user) return user;

    const gitlabUserInfo =
      await this.gitlabApiService.getUserInfo(gitlabUserID);
    if (!gitlabUserInfo) {
      // Пользователь-заглушка используется для того, чтобы приложение не падало при отсутствии реального пользователя, например, когда новый сотрудник еще не был добавлен в базу
      return this.dummyUser;
    }

    const createUser = new Users();
    createUser.gitlabID = gitlabUserInfo.id;
    createUser.name = gitlabUserInfo.name;
    createUser.gitlabName = gitlabUserInfo.username;

    return createUser;
  }

  /** Возвращает либо имя пользователя по его ID, либо заглушку "Кто-то" */
  async getUserNameById(gitlabUserID: number): Promise<string> {
    const user = await this.userRepository.findOne({
      where: {
        gitlabID: gitlabUserID,
      },
      select: {
        name: true,
      },
    });

    if (user) return user.name;

    const gitlabUserInfo =
      await this.gitlabApiService.getUserInfo(gitlabUserID);
    if (gitlabUserInfo) {
      return gitlabUserInfo.name;
    }
    return this.dummyUser.name;
  }

  /** На вход принимается массив строк - username-ы пользователей гитлаба. Юзернейм может иметь @ в начале.
   * Возвращает массив id-шников этих пользователей гитлаба
   */
  async getGitlabUserIDsByUserNames(
    usernames: Array<string>,
  ): Promise<Array<number | undefined>> {
    if (!usernames.length) return [];
    const tags: Array<number | undefined> = await Promise.all(
      usernames.map(async (username) => {
        const tag = await this.getGitlabUserIdByUserName(username);
        if (tag) return tag;
        return undefined;
      }),
    );
    return tags;
  }

  /** Возвращает id пользователя gitlab по его юзернейму */
  async getGitlabUserIdByUserName(
    gitlabUsername: string,
  ): Promise<number | null> {
    let cleanedUserName = gitlabUsername;
    if (gitlabUsername.at(0) === '@') {
      cleanedUserName = gitlabUsername.slice(1);
    }

    const user = await this.userRepository.findOne({
      where: {
        gitlabName: cleanedUserName,
      },
      select: {
        gitlabID: true,
      },
    });
    return user?.gitlabID || null;
  }

  async getUserNotificationSettings(userID: number): Promise<UserSettings> {
    const user = await this.userRepository.findOne({
      where: {
        gitlabID: userID,
      },
      relations: {
        userSettings: true,
      },
    });
    return user.userSettings;
  }

  async saveUserSettings(userSettings: UserSettings) {
    await this.userSettingsRepository.save([userSettings]);
  }
}
