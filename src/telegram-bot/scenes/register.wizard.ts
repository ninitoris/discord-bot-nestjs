import { UserService } from './../../user/user.service';
import { MessageManager } from '@src/telegram-bot/message-manager/message-manager';
import {
  Action,
  Context,
  Hears,
  InjectBot,
  Wizard,
  WizardStep,
} from 'nestjs-telegraf';
import { Markup, Scenes, Telegraf } from 'telegraf';
import {
  ChatContext,
  RegisterData,
  RegisterWizardContext,
} from '../types/telegram-bot-types';
import { GitLabApiService } from '../../gitlab-api/gitlab-api.service';
import { StartMenuText } from '../telegram-bot.menu';
import { UtilsService } from '../../utils/utils.service';
import { ConfigService } from '@nestjs/config';
import { UserInfo } from '@src/gitlab-webhook/gitlab-webhook.types';
import {
  ExtraEditMessageText,
  ExtraReplyMessage,
} from 'telegraf/typings/telegram-types';
import { TelegramBotUtils } from '../utils/telegram-bot.utils';

enum Steps {
  greeting = 0, // Приветственное сообщение
  inputLink = 1, // Пользователь вводит ссылку на гитлаб
  selectName = 2, // Подтверждение правильности имени
  editName = 3, // Если нужно изменить имя (необязательно)
  selectOrganization = 4, // Выбор организациипо кнопке (ипк, клик, ади)
  selectDiscord = 5, // Ввести или нет дискорд (необязательно)
  inputDiscord = 6, // Ввод юзернейма дисокрда
  selectSex = 7, // Выбор пола
  confirmation = 8, // Просмотр введенных данных
}

@Wizard('registerUser')
export class RegisterWizard {
  constructor(
    private readonly mm: MessageManager,
    private readonly gitlabApi: GitLabApiService,
    private readonly userService: UserService,
    private readonly utilsService: UtilsService,
    private readonly configService: ConfigService,
    private readonly telegramBotUtils: TelegramBotUtils,
    @InjectBot() private readonly bot: Telegraf,
  ) {}

  backButton = [Markup.button.callback('🏠 Вернуться в меню', 'quit')];
  goBackButton = Markup.inlineKeyboard([this.backButton]);

  @WizardStep(Steps.greeting)
  protected async greeting(@Context() ctx: Scenes.WizardContext) {
    const msgText =
      'Для того чтобы получить доступ к уведомлениям нужно подтвердить аккаунт';

    const msgButtons = Markup.inlineKeyboard([
      [Markup.button.callback('🦊 Ввести ссылку на гитлаб', 'enterGitlab')],
      this.backButton,
    ]);

    await this.mm.msg(ctx, msgText, msgButtons);
  }

  @Action('enterGitlab')
  protected async enterGitlab(@Context() ctx: RegisterWizardContext) {
    await this.mm.msg(
      ctx,
      '🦊 Введите ссылку на гитлаб аккаунт',
      this.goBackButton,
    );

    ctx.wizard.selectStep(Steps.inputLink);
  }

  @WizardStep(Steps.inputLink)
  protected async inputLink(@Context() ctx: RegisterWizardContext) {
    if (!('message' in ctx.update && 'text' in ctx.update.message)) {
      return;
    }
    await this.mm.userSentSomething(ctx);
    const userInput = ctx.update.message.text;
    const username = getUsername(userInput);
    if (!username) {
      await this.mm.sendNewMessage(
        ctx,
        `🫠 Неправильная ссылка, попробуйте снова`,
        this.goBackButton,
      );
      this.mm.cleanUpChat(ctx.chat.id);
      ctx.wizard.selectStep(Steps.inputLink);
      return;
    }

    const gitlabUserInfo: UserInfo = await this.gitlabApi.getUserInfo(username);
    if (!gitlabUserInfo) {
      await this.mm.sendNewMessage(
        ctx,
        `🫠 Пользователя не существует, попробуйте снова`,
        this.goBackButton,
      );
      this.mm.cleanUpChat(ctx.chat.id);
      ctx.wizard.selectStep(Steps.inputLink);
      return;
    }

    // TODO: добавить проверку, что нет заявки на регисрацию этого пользователя

    ctx.session.gitlabUserInfo = gitlabUserInfo;
    ctx.session.telegramUsername = ctx.update.message.from.username;
    ctx.wizard.selectStep(Steps.selectName);
    await this.selectName(ctx);
  }

  @WizardStep(Steps.selectName)
  protected async selectName(@Context() ctx: RegisterWizardContext) {
    const name = ctx.session.name ?? ctx.session.gitlabUserInfo.name;
    const validName = validateAndFormatName(name);
    if (!validName) {
      const msgText = `👤 Ваше имя и фамилия должны быть на русском языке\n❌ ${name}`;
      const msgButtons = Markup.inlineKeyboard([
        [Markup.button.callback('📝 Изменить имя', 'nameIsWrong')],
        this.backButton,
      ]);
      await this.mm.sendNewMessage(ctx, msgText, msgButtons);
      this.mm.cleanUpChat(ctx.chat.id);
      return;
    }
    const msgText = `👤 Имя и фамилия верные?\n${name}`;

    const msgButtons = Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Все верно', 'nameIsRight'),
        Markup.button.callback('📝 Изменить имя', 'nameIsWrong'),
      ],
      this.backButton,
    ]);

    await this.mm.msg(ctx, msgText, msgButtons);
    this.mm.cleanUpChat(ctx.chat.id);
    return;
  }

  @Action('nameIsRight')
  protected async nameIsRight(@Context() ctx: RegisterWizardContext) {
    ctx.session.name = ctx.session.gitlabUserInfo.name;
    ctx.wizard.selectStep(Steps.selectOrganization);
    await this.selectOrganization(ctx);
  }

  @Action('nameIsWrong')
  protected async nameIsWrong(@Context() ctx: RegisterWizardContext) {
    await this.mm.msg(
      ctx,
      '👀 Введите новое имя в формате Имя Фамилия',
      this.goBackButton,
    );

    ctx.wizard.selectStep(Steps.editName);
    await this.editName(ctx);
  }

  @WizardStep(Steps.editName)
  protected async editName(@Context() ctx: RegisterWizardContext) {
    if (!('message' in ctx.update && 'text' in ctx.update.message)) {
      return;
    }
    const invalidNameMsg = `🫠 Неправильное имя, попробуйте снова.`;
    await this.mm.userSentSomething(ctx);
    const name = ctx.update.message.text;

    if (typeof name !== 'string') {
      await this.mm.msg(ctx, invalidNameMsg, this.goBackButton);
      ctx.wizard.selectStep(Steps.editName);
      return;
    }

    const formattedName = validateAndFormatName(name);
    if (!formattedName) {
      await this.mm.msg(ctx, invalidNameMsg, this.goBackButton);
      ctx.wizard.selectStep(Steps.editName);
      return;
    }

    ctx.session.name = formattedName;
    ctx.wizard.selectStep(Steps.editName);
    await this.selectName(ctx);
  }

  @WizardStep(Steps.selectOrganization)
  protected async selectOrganization(@Context() ctx: RegisterWizardContext) {
    const msgText = `🏭 Выберите организацию`;

    const msgButtons = Markup.inlineKeyboard([
      [
        Markup.button.callback('Интерпроком', 'orgIsInterprocom'),
        Markup.button.callback('Клик', 'orgIsClick'),
        Markup.button.callback('Ади', 'orgIsAdi'),
      ],
      this.backButton,
    ]);

    await this.mm.msg(ctx, msgText, msgButtons);
  }

  @Action('orgIsInterprocom')
  protected async orgIsInterprocom(@Context() ctx: RegisterWizardContext) {
    ctx.session.orgID = 'Интерпроком';
    ctx.wizard.selectStep(Steps.selectDiscord);
    await this.selectDiscord(ctx);
  }

  @Action('orgIsClick')
  protected async orgIsClick(@Context() ctx: RegisterWizardContext) {
    ctx.session.orgID = 'Клик';
    ctx.wizard.selectStep(Steps.selectDiscord);
    await this.selectDiscord(ctx);
  }

  @Action('orgIsAdi')
  protected async orgIsAdi(@Context() ctx: RegisterWizardContext) {
    ctx.session.orgID = 'Ади';
    ctx.wizard.selectStep(Steps.selectDiscord);
    await this.selectDiscord(ctx);
  }

  @WizardStep(Steps.selectDiscord)
  protected async selectDiscord(@Context() ctx: RegisterWizardContext) {
    // временно отключаем дискорд
    // TODO: discord
    ctx.wizard.selectStep(Steps.selectSex);
    await this.selectSex(ctx);
    return;

    const msgText = `🔔 Получать уведомления в дискорд?`;

    const msgButtons = Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Да', 'useDiscord'),
        Markup.button.callback('❌ Нет', 'dontUseDiscord'),
      ],
      this.backButton,
    ]);

    await this.mm.msg(ctx, msgText, msgButtons);
  }

  @Action('useDiscord')
  protected async useDiscord(@Context() ctx: RegisterWizardContext) {
    await this.mm.msg(ctx, '👀 Введите ваш айди в дискорде (не имя)');

    ctx.wizard.selectStep(Steps.inputDiscord);
    await this.inputDiscord(ctx);
  }

  @Action('dontUseDiscord')
  protected async dontUseDiscord(@Context() ctx: RegisterWizardContext) {
    ctx.wizard.selectStep(Steps.selectSex);
    await this.selectSex(ctx);
  }

  @WizardStep(Steps.inputDiscord)
  protected async inputDiscord(@Context() ctx: RegisterWizardContext) {
    if (!('message' in ctx.update && 'text' in ctx.update.message)) {
      return;
    }

    const invalidNameMsg = `🫠 Неправильное имя, попробуйте снова.`;
    await this.mm.userSentSomething(ctx);
    const discordName = ctx.update.message.text;

    if (typeof discordName !== 'string') {
      await this.mm.msg(ctx, invalidNameMsg, this.goBackButton);
      ctx.wizard.selectStep(Steps.inputDiscord);
      return;
    }

    const validName = isValidDiscordUsername(discordName);
    if (!validName) {
      await this.mm.msg(ctx, invalidNameMsg, this.goBackButton);
      ctx.wizard.selectStep(Steps.inputDiscord);
      return;
    }

    ctx.session.discordName = discordName;
    ctx.wizard.selectStep(Steps.selectSex);
    await this.selectSex(ctx);
  }

  @WizardStep(Steps.selectSex)
  protected async selectSex(@Context() ctx: RegisterWizardContext) {
    const msgText = `🫵 Выберите пол`;

    const msgButtons = Markup.inlineKeyboard([
      [
        Markup.button.callback('⚽️ Мужчина', 'male'),
        Markup.button.callback('🙍‍♀️ Девушка', 'female'),
      ],
      this.backButton,
    ]);

    await this.mm.msg(ctx, msgText, msgButtons);
  }

  @Action('male')
  protected async male(@Context() ctx: RegisterWizardContext) {
    ctx.session.female = false;
    ctx.wizard.selectStep(Steps.confirmation);
    await this.confirmation(ctx);
  }

  @Action('female')
  protected async female(@Context() ctx: RegisterWizardContext) {
    ctx.session.female = true;
    ctx.wizard.selectStep(Steps.confirmation);
    await this.confirmation(ctx);
  }

  @WizardStep(Steps.confirmation)
  protected async confirmation(@Context() ctx: RegisterWizardContext) {
    const session = ctx.session;

    // TODO: discord
    const msgText = `👀 Проверьте данные перед отправкой\n🦊 Ссылка на аккаунт:\n${this.utilsService.escapeMarkdown(session.gitlabUserInfo?.web_url)}\n\n👤 Имя:\n${session?.name}\n\n🏭 Организация:\n${session?.orgID}\n\n🫵 Пол:\n${session.female ? 'Женский' : 'Мужской'}\n\n🔔 Получать уведомления в дискорде \\(временно недоступно\\):\n${session.discordName ? `Да, на аккаунт ${this.utilsService.escapeMarkdown(session.discordName)}` : 'Нет'}`;

    const msgButtons = Markup.inlineKeyboard([
      [
        Markup.button.callback('Все верно', 'confirm'),
        Markup.button.callback('Начать сначала', 'startOver'),
      ],
      this.backButton,
    ]);

    await this.mm.msg(ctx, msgText, {
      parse_mode: 'MarkdownV2',
      link_preview_options: { is_disabled: true },
      reply_markup: msgButtons.reply_markup,
    });
  }

  /**Подтвердить аккаунт и отправить его на проверку в другой чат*/
  @Action('confirm')
  protected async confirm(@Context() ctx: RegisterWizardContext) {
    const session = ctx.session;

    const startMenu = await this.telegramBotUtils.getStartMenu(
      ctx.callbackQuery.from.id,
    );
    await this.mm.msg(ctx, '✅ Аккаунт отправлен на проверку', startMenu);
    await ctx.scene.leave();

    const registerData: RegisterData = {
      gitlabName: session.gitlabUserInfo.username,
      gitlabID: session.gitlabUserInfo.id,
      name: session.name,
      telegramID: ctx.chat.id ?? null,
      telegramUsername: ctx.chat.username ?? null,
      orgID: session.orgID ?? null,
      discordName: session.discordName ?? null,
      female: session.female ?? false,
      gitlabUserInfo: session.gitlabUserInfo,
      createdBy: ctx.chat.username,
    };

    const registrationRequest =
      await this.userService.createRegistrationRequest(registerData);
    const messageText = `👀 Пользователь хочет зарегистрироваться\n\n🦊 Ссылка на аккаунт:\n${session.gitlabUserInfo.web_url}\n\n👤 Имя:\n${session?.name}\n\n📱 Телега:\n@${session.telegramUsername}\n\n🎪 Организация:\n${session?.orgID}\n\n🫵 Пол:\n${session.female ? 'Женский' : 'Мужской'}\n\n🔔 Получать уведомления в дискорде:\n${session.discordName ? `Да, на аккаунт ${session.discordName}` : 'Нет'}`;

    // Отправка сообщения в другой чат
    // Переменная чата админов
    const chatId = this.configService.get<number>('CHAT_ID');

    const msgButtons = Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Подтвердить аккаунт', 'approveUser'),
        Markup.button.callback('❌ Отклонить', 'rejectUser'),
      ],
    ]);
    const extra: ExtraReplyMessage | ExtraEditMessageText = {
      link_preview_options: {
        is_disabled: true, // выключил превью ссылок, потому что ссылки на gitlab.interprocom.ru у нас выглядят не очень красиво
      },
      reply_markup: msgButtons.reply_markup,
    };

    const msg = await this.mm.sendMsgInChat(chatId, messageText, extra);
    const msgID = msg.message_id;
    registrationRequest.messageID = msgID;
    await this.userService.saveRegistrationRequest(registrationRequest);
  }

  /**Начать регистрацию сначала*/
  @Action('startOver')
  protected async startOver(@Context() ctx: RegisterWizardContext) {
    ctx.wizard.selectStep(Steps.greeting);
    clearContext(ctx);
    await this.greeting(ctx);
  }

  /**Ворнуться на главную*/
  @Action('quit')
  protected async quit(@Context() ctx: RegisterWizardContext) {
    await ctx.scene.leave();
    clearContext(ctx);
    const startMenu = await this.telegramBotUtils.getStartMenu(
      ctx.callbackQuery.from.id,
    );
    await this.mm.msg(ctx, StartMenuText, startMenu);
  }

  /**Удалить любые сообщения, если шаг равен шагу в котором юзер должен что-то ввести вызываем функцию шага*/
  @Hears(/.*/)
  protected async onAnyText(@Context() ctx: RegisterWizardContext) {
    if (
      ctx.wizard.cursor !== Steps.inputLink &&
      ctx.wizard.cursor !== Steps.editName &&
      ctx.wizard.cursor !== Steps.inputDiscord
    ) {
      await ctx.deleteMessage();
    }

    switch (ctx.wizard.cursor) {
      case Steps.inputLink:
        await this.inputLink(ctx);
        break;
      case Steps.editName:
        await this.editName(ctx);
        break;
      case Steps.inputDiscord:
        await this.inputDiscord(ctx);
        break;
    }
  }
}

/**Возваращает гитлаб юзернейм из ссылки*/
const getUsername = (url: string): string | null => {
  const baseGitlabUrl = 'https://gitlab.interprocom.ru/';
  const username = url.startsWith(baseGitlabUrl)
    ? url.slice(baseGitlabUrl.length)
    : null;

  return username ? username : null;
};

/**Проверяет фамилию на валидность*/
const validateAndFormatName = (input: string): string | null => {
  const namePattern = /^[а-яё]+\s[а-яё]+$/i;
  const trimmedInput = input.trim().toLowerCase();

  if (namePattern.test(trimmedInput)) {
    const [firstName, lastName] = trimmedInput.split(' ');
    const formattedName = `${capitalize(firstName)} ${capitalize(lastName)}`;

    return formattedName;
  }

  return null;
};

/**Делает первые буквы имени и фамилии заглавными*/
const capitalize = (word: string): string => {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
};

/**Проверяет дискорд юзернейма*/
const isValidDiscordUsername = (username: string): boolean => {
  const discordPattern = /^[a-zA-Zа-яёА-ЯЁ0-9._-]{2,32}$/;

  return discordPattern.test(username);
};

const clearRegisterData = (obj: Partial<RegisterData>) => {
  Object.keys(obj).forEach((key) => {
    delete obj[key as keyof RegisterData];
  });
};

const clearContext = (ctx: RegisterWizardContext) => {
  const sessionKeys: (keyof RegisterData)[] = [
    'createdBy',
    'discordName',
    'female',
    'gitlabName',
    'name',
    'telegramID',
    'telegramUsername',
    'gitlabUserInfo',
  ];

  sessionKeys.forEach((key) => {
    delete ctx.session[key];
  });
};
