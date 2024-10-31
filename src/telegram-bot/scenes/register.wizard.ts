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
import { RegisterWizardContext } from '../types/telegram-bot-types';
import { GitLabApiService } from '../../gitlab-api/gitlab-api.service';
import { StartMenuMarkup, StartMenuText } from '../telegram-bot.constants';
import { UtilsService } from '../../utils/utils.service';
import { ConfigService } from '@nestjs/config';

enum Steps {
  greeting = 0, // Приветственное сообщение
  inputLink = 1, // Пользователь вводит ссылку на гитлаб
  selectName = 2, // Подтверждение правильности имени
  editName = 3, // Если нужно изменить имя (необязательно)
  selectOrganization = 4, // Выбор организациипо кнопке (ипк, клик)
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
      await this.mm.msg(
        ctx,
        `🫠 Неправильная ссылка, попробуйте снова`,
        this.goBackButton,
      );
      ctx.wizard.selectStep(Steps.inputLink);
      return;
    }

    const userInfo = await this.gitlabApi.getUserInfo(username);
    if (!userInfo) {
      await this.mm.msg(
        ctx,
        `🫠 Пользователя не существует, попробуйте снова`,
        this.goBackButton,
      );
      ctx.wizard.selectStep(Steps.inputLink);
      return;
    }
    if (userInfo.username) {
      ctx.session.userInfo = userInfo;
      ctx.wizard.selectStep(Steps.selectName);
      await this.selectName(ctx);
    }
  }

  @WizardStep(Steps.selectName)
  protected async selectName(@Context() ctx: RegisterWizardContext) {
    const name = ctx.session.name ?? ctx.session.userInfo.name;
    const validName = validateAndFormatName(name);
    if (!validName) {
      const msgText = `👤 Ваше имя и фамилия должны быть на русском языке\n❌ ${name}`;
      const msgButtons = Markup.inlineKeyboard([
        [Markup.button.callback('📝 Изменить имя', 'nameIsWrong')],
        this.backButton,
      ]);
      return await this.mm.msg(ctx, msgText, msgButtons);
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
  }

  @Action('nameIsRight')
  protected async nameIsRight(@Context() ctx: RegisterWizardContext) {
    ctx.wizard.selectStep(Steps.selectOrganization);
    await this.selectOrganization(ctx);
  }

  @Action('nameIsWrong')
  protected async nameIsWrong(@Context() ctx: RegisterWizardContext) {
    await this.mm.msg(
      ctx,
      '👀 Введите новое имя в форме Имя Фамилия',
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

  @WizardStep(Steps.selectDiscord)
  protected async selectDiscord(@Context() ctx: RegisterWizardContext) {
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
    ctx.session.orgID = 'Клик';
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

    const msgText = `👀 Проверьте данные перед отправкой\n🦊 Ссылка на аккаунт:\n${this.utilsService.escapeMarkdown(session.userInfo.web_url)}\n\n👤 Имя:\n${this.utilsService.escapeMarkdown(session?.userInfo?.name)}\n\n🏭 Организация:\n${this.utilsService.escapeMarkdown(session?.orgID)}\n\n🫵 Пол:\n${session.female ? 'Женский' : 'Мужской'}\n\n🔔 Получать уведомления в дискорде:\n${session.discordName ? `Да, на аккаунт ${this.utilsService.escapeMarkdown(session.discordName)}` : 'Нет'}`;

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
    const chatId = this.configService.get<number>('CHAT_ID');
    const session = ctx.session;
    const messageText = `👀 Пользователь хочет зарегистрироваться\n🦊 Ссылка на аккаунт:\n${session.userInfo.web_url}\n\n👤 Имя:\n${session?.name}\n\n🏭 Организация:\n${session?.orgID}\n\n🫵 Пол:\n${session.female ? 'Женский' : 'Мужской'}\n\n🔔 Получать уведомления в дискорде:\n${session.discordName ? `Да, на аккаунт ${session.discordName}` : 'Нет'}`;
    const msgButtons = Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Подтвердить аккаунт', 'approve'),
        Markup.button.callback('❌ Отклонить', 'reject'),
      ],
    ]);

    await this.mm.msg(ctx, '✅ Аккаунт отправлен на проверку', StartMenuMarkup);
    await ctx.scene.leave();

    const registerData = {
      gitlabName: session.userInfo.username,
      name: session.name,
      telegramID: ctx.chat.id ?? null,
      telegramUsername: ctx.chat.username ?? null,
      orgID: session.orgID ?? null,
      discordName: session.discordName ?? null,
      female: session.female ?? false,
      userInfo: session.userInfo,
    };

    await this.mm.sendMsgInChat(chatId, messageText, msgButtons);

    this.bot.action('approve', async (ctx) => {
      const newUser = await this.userService.createUser(registerData);
      if (!newUser) {
        return await this.mm.msg(ctx, '💀 Произошла непредвиденная ошибка');
      }

      await this.mm.sendMsgInChat(
        registerData.telegramID,
        '🎉 Вы успешно прошли регистрацию!',
      );

      return await this.mm.msg(ctx, '🎉 Пользователь успешно зарегистрирован');
    });

    this.bot.action('reject', async (ctx) => {
      await this.mm.sendMsgInChat(
        registerData.telegramID,
        '🙅‍♂️ Вам отклонено в регистрации',
      );
      return await this.mm.msg(ctx, '🙅‍♂️ Пользователю отклонено в регистрации');
    });
  }

  /**Начать регистрацию сначала*/
  @Action('startOver')
  protected async startOver(@Context() ctx: RegisterWizardContext) {
    ctx.wizard.selectStep(Steps.greeting);
    await this.greeting(ctx);
  }

  /**Возвращает на главную*/
  @Action('quit')
  protected async quit(@Context() ctx: RegisterWizardContext) {
    await ctx.scene.leave();
    await this.mm.msg(ctx, StartMenuText, StartMenuMarkup);
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
