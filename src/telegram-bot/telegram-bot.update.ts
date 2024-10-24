import { Logger } from '@nestjs/common';
import { Ctx, On, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';

@Update()
export class TelegramBotUpdate {
  @On('text')
  async onText(@Ctx() ctx: Context) {
    if (!('text' in ctx.message)) {
      Logger.log(ctx.message);
      return;
    }

    const message = ctx.message.text;
    const regex = /[гГ][оО]+[лЛ]/;
    if (regex.test(message)) {
      await ctx.reply('ГООООООООООЛ');
    }
  }
}
