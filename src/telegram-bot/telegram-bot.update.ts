import { Logger } from '@nestjs/common';
import { MessageManager } from '@src/telegram-bot/message-manager/message-manager';
import {
  Action,
  Command,
  Ctx,
  Hears,
  On,
  Start,
  Update,
} from 'nestjs-telegraf';
import { Context, Markup, Scenes } from 'telegraf';
import { Update as TelegrafUpdate } from 'telegraf/types';

export enum NavigationButtons {
  notificationsConfig = 'Настроить уведомления',
}

export const StartMenuText = 'Меню 1';
export const StartMenuMarkup = Markup.inlineKeyboard([
  [
    Markup.button.callback(
      NavigationButtons.notificationsConfig,
      'notifications',
    ),
  ],
  [
    Markup.button.callback('Кнопка 2', 'btn2'),
    Markup.button.callback('Кнопка 3', 'btn2'),
  ],
  [Markup.button.callback('Кнопка 4', 'btn2')],
]);

export interface MyCoolContext extends Context {
  update: TelegrafUpdate;
}

@Update()
export class TelegramBotUpdate {
  constructor(private readonly mm: MessageManager) {}

  @Start()
  async start(@Ctx() ctx: Context) {
    await this.mm.userSentSomething(ctx);
    await this.mm.msg(ctx, StartMenuText, StartMenuMarkup);
  }

  @Action('notifications')
  @Hears(NavigationButtons.notificationsConfig)
  @Command('notifications')
  async notificationsSetup(ctx: Scenes.WizardContext) {
    // проверить, есть ли этот пользователь в банке. Если нет, то не заходить в сцену
    await ctx.scene.enter('notificationsSetup');
  }

  // @Command('test')
  // async test(ctx: Scenes.WizardContext) {
  //   await ctx.scene.enter('test');
  // }

  // это должно быть в конце
  @On('text')
  async onText(@Ctx() ctx: Context) {
    if (!('text' in ctx.message)) {
      Logger.log(ctx.message);
      return;
    }

    await this.mm.userSentSomething(ctx);

    // console.log(ctx.message);

    const message = ctx.message.text;
    const regex = /[гГ][оО]+[лЛ]/;
    if (regex.test(message)) {
      await this.mm.sendNewMessage(ctx, 'ГООООООООООЛ');
      return;
    }

    await this.mm.msg(ctx, StartMenuText, StartMenuMarkup);
  }
}
