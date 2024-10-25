import { Logger } from '@nestjs/common';
import { Action, Ctx, Hears, Start, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UserService } from '../user/user.service';
import { GitLabApiService } from '../gitlab-api/gitlab-api.service';

const chatId = '-1002035561069';
// Объект который отвечает за "очередь" на регистрацию
const userStates: Record<number, string | null> = {};

@Update()
export class TelegramBotUpdate {
  constructor(
    private readonly userService: UserService,
    private readonly gitlabApi: GitLabApiService,
  ) {}

  @Start()
  async start(@Ctx() ctx: Context) {
    if (ctx.chat.type === 'private') {
      await ctx.reply('Отправьте ссылку на профиль GitLab 🦊');
    }
  }

  @Hears(/https:\/\/gitlab\.interprocom\.ru\/([a-zA-Z0-9_-]+)/)
  async hears(@Ctx() ctx: Context) {
    // по какой-то причне Context плохо типизирован, и нужно писать костыльную проверку
    if (!('text' in ctx.message)) {
      Logger.log(ctx.message);
      return;
    }

    const userTgId = ctx.from?.id;
    const userTgName = ctx.from?.username;
    const url = ctx.message.text;
    const username = url?.match(/\/([^\/]+)$/)?.[1].toLowerCase();

    if (userStates[userTgId]) {
      await ctx.reply('Вы уже отправили логин на проверку.');
      return;
    }

    // Проверка на то, добавен ли gitlab аккаунт
    // const gitlbabUser = await this.userService.findByGitlabName(username);
    // if (gitlbabUser) {
    //   await ctx.reply('Данный пользователь уже добавлен.');
    //   return;
    // }

    // Проверка на то, добавлял ли данный тг пользователь gitlab аккаунт
    // const tgUser = await this.userService.findByTgID(userTgId);
    // if (tgUser) {
    //   await ctx.reply('Вы уже отправили логин на проверку.');
    //   return;
    // }

    if (userTgId && !userStates[userTgId]) {
      userStates[userTgId] = username;
      const userInfo = await this.gitlabApi.getUserInfo(username);
      const messageToGroup = `\nНовый пользователь хочет зарегистрироваться:
      \n⚽️ <a href="tg://user?id=${userTgId}">${userTgName ? `@${userTgName}` : 'Пользователь'}</a>
      \n🦊 ${url}
      \n👤 ${userInfo?.name}
      \n🦫 Мужчина
      \n🏭 Интерпроком
      `;

      await ctx.telegram.sendMessage(chatId, messageToGroup, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('Редактировать', `edit_${userTgId}`)],
          [
            Markup.button.callback('Подтвердить', `approve_${userTgId}`),
            Markup.button.callback('Отказать', `reject_${userTgId}`),
          ],
        ]),
      });

      await ctx.reply('Ваш логин отправлен на проверку.');
    }
  }

  @Action(/approve_(\d+)/)
  async approveAction(@Ctx() ctx: Context) {
    if (!('match' in ctx)) {
      Logger.log('Match не найден');
      return;
    }
    const match = ctx.match as RegExpExecArray;
    const userId = Number(match[1]);
    const username = userStates[userId];

    if (username) {
      await this.userService.createUser({
        gitlabName: username,
        telegramID: userId,
      });

      await ctx.telegram.sendMessage(
        userId,
        `Аккаунт подтвержен.\nГруппа с уведомлениями: https://t.me/+QIVMC3S7UqYwNGYy`,
      );

      // Уведомление в группе
      await ctx.sendMessage(`Пользователь был успешно подтвержден.`);

      delete userStates[userId];
    }
  }

  @Action(/reject_(\d+)/)
  async rejectAction(@Ctx() ctx: Context) {
    if (!('match' in ctx)) {
      Logger.log('Match не найден');
      return;
    }
    const match = ctx.match as RegExpExecArray;
    const userId = Number(match[1]);
    const userLogin = userStates[userId];

    if (userLogin) {
      await ctx.telegram.sendMessage(userId, `Указанный вами логин отклонен.`);
      // TODO можно добавить блеклист для отклоненных пользователей

      // Уведомление в группе
      await ctx.sendMessage(`Регистрация пользователя была отклонена.`);

      delete userStates[userId];
    }
  }

  @Action(/edit_(\d+)/)
  async editAction(@Ctx() ctx: Context) {
    if (!('match' in ctx)) {
      Logger.log('Match не найден');
      return;
    }

    const match = ctx.match as RegExpExecArray;
    const userId = Number(match[1]);

    await ctx.editMessageReplyMarkup({
      inline_keyboard: [
        [
          Markup.button.callback('👤 Имя', `update_name_${userId}`),
          Markup.button.callback('🦫 Пол', `update_gender_${userId}`),
          Markup.button.callback('🏭 Организация', `update_org_${userId}`),
        ],
      ],
    });
  }
}
