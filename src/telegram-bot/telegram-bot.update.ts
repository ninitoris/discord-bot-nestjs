import { Logger } from '@nestjs/common';
import { Action, Ctx, Hears, Start, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UserService } from '../user/user.service';

const chatId = '-1002035561069';
const userStates: Record<number, string | null> = {};

@Update()
export class TelegramBotUpdate {
  constructor(private readonly userService: UserService) {}
  @Start()
  async start(@Ctx() ctx: Context) {
    if (ctx.chat.type === 'private') {
      await ctx.reply('Отправьте ссылку на профиль GitLab 🦊');
    }
  }

  @Hears(/https:\/\/gitlab\.interprocom\.ru\/([a-zA-Z0-9_-]+)/)
  async hears(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    const userName = ctx.from?.username;
    if (!('text' in ctx.message)) {
      Logger.log(ctx.message);
      return;
    }

    const url = ctx.message.text;

    if (userStates[userId]) {
      await ctx.reply('Вы уже отправили логин на проверку.');
      return;
    }

    if (userId && !userStates[userId]) {
      userStates[userId] = url; // Сохраняем текст сообщения, а не объект

      const messageToGroup = `Новый пользователь хочет зарегистрироваться:\n👤 <a href="tg://user?id=${userId}">${userName ? `@${userName}` : 'Пользователь'}</a>\n🦊 ${url}\n`;

      await ctx.telegram.sendMessage(chatId, messageToGroup, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback('Подтвердить', `approve_${userId}`),
            Markup.button.callback('Отказать', `reject_${userId}`),
          ],
        ]),
      });

      await ctx.reply('Ваш логин отправлен на проверку.');
    }
  }

  @Action(/approve_(\d+)/)
  async approveAction(@Ctx() ctx: Context) {
    // по какой-то причне Context плохо типизирован, и нужно писать костыльную проверку
    if (!('match' in ctx)) {
      Logger.log('Match не найден');
      return;
    }
    const match = ctx.match as RegExpExecArray;
    const userId = Number(match[1]);
    const url = userStates[userId];

    if (url) {
      const username = url.match(/\/([^\/]+)$/)?.[1];

      this.userService.createUser({
        gitlabName: username,
        telegramID: userId,
      });

      await ctx.telegram.sendMessage(
        userId,
        `Аккаунт подтвержен.\nГруппа с уведомлениями: https://t.me/+QIVMC3S7UqYwNGYy`,
      );

      // Уведомление в группе
      await ctx.editMessageText(`Пользователь был успешно подтвержден.`);

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
      await ctx.editMessageText(`Регистрация пользователя была отклонена.`);

      delete userStates[userId];
    }
  }
}
