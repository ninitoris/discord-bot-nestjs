import { MessageManager } from '@src/telegram-bot/message-manager/message-manager';
import {
  NavigationButtons,
  StartMenuMarkup,
  StartMenuText,
} from '@src/telegram-bot/telegram-bot.constants';
import { Action, Command, Ctx, Hears, Start, Update } from 'nestjs-telegraf';
import { Context, Scenes } from 'telegraf';

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

  @Action('registerUser')
  @Hears(NavigationButtons.regiseter)
  @Command('registerUser')
  async regiseterUser(ctx: Scenes.WizardContext) {
    await ctx.scene.enter('registerUser');
  }

  @Action('approve')
  protected async approve(@Ctx() ctx: Context) {
    await this.mm.msg(ctx, 'да все топчик');
  }

  @Action('reject')
  protected async reject(@Ctx() ctx: Context) {
    await this.mm.msg(ctx, 'не топчик');
  }
}
