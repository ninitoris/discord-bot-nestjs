import { Logger } from '@nestjs/common';
import { MessageManager } from '@src/telegram-bot/message-manager/message-manager';
import {
  NavigationButtons,
  StartMenuMarkup,
  StartMenuText,
} from '@src/telegram-bot/telegram-bot.constants';
import {
  Action,
  Command,
  Ctx,
  Hears,
  On,
  Start,
  Update,
} from 'nestjs-telegraf';
import { Context, Scenes } from 'telegraf';

/*
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
*/

@Update()
export class TelegramBotUpdate {
  constructor(private readonly mm: MessageManager) {}

  @On('text')
  async onText(@Ctx() ctx: Context) {
    await ctx.deleteMessage();
  }
}
