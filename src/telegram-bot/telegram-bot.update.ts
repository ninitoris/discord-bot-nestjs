import { Logger } from '@nestjs/common';
import { Ctx, On, Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';

@Update()
export class TelegramBotUpdate {
  @Start()
  async start(@Ctx() ctx: Context) {
    console.log(ctx.message);
    await ctx.reply('Начать');
  }

  // это должно быть в конце
  @On('text')
  async onText(@Ctx() ctx: Context) {
    if (!('text' in ctx.message)) {
      Logger.log(ctx.message);
      return;
    }

    console.log(ctx.message);

    const message = ctx.message.text;
    const regex = /[гГ][оО]+[лЛ]/;
    if (regex.test(message)) {
      await ctx.reply('ГООООООООООЛ');
    }
  }
}
