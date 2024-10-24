import { Markup, type Context } from 'telegraf';
import type { GeneralNotificationType } from '../notification-strategy';
import axios from 'axios';
import { Action, Ctx, Hears, Start, Update } from 'nestjs-telegraf';

const chatId = '-1002035561069';
const userStates: Record<number, string | null> = {};

@Update()
export class AppUpdate {
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
    // const url = ctx.message?.text;
    const url = 'ctx.message'; // Используем текст сообщения

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
    const userId = 1;
    // const userId = Number(ctx.match[1]);
    const userLogin = userStates[userId];

    if (userLogin) {
      axios.get('name');

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
    // Исправлен дублирующийся обработчик
    // const userId = Number(ctx.match[1]);
    const userId = 2;
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

export function sendMessage(options: GeneralNotificationType) {
  return options;
}
