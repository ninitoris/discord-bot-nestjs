import { Logger } from '@nestjs/common';
import { Action, Context, Wizard, WizardStep } from 'nestjs-telegraf';
import { Markup, Scenes } from 'telegraf';
import { CallbackQuery, Update } from 'telegraf/typings/core/types/typegram';

export interface MyTestContext extends Scenes.WizardContext {
  update: Update.CallbackQueryUpdate<CallbackQuery.DataQuery>;
}

@Wizard('test')
export class TestWizard {
  @WizardStep(1)
  protected async step1(@Context() ctx: MyTestContext) {
    ctx.reply(
      'Это шаг 1',
      Markup.inlineKeyboard([[Markup.button.callback('Шаг 2', 'toStep2')]]),
    );
  }

  @WizardStep(2)
  protected async step2(@Context() ctx: MyTestContext) {
    ctx.reply(
      'Это шаг 2',
      Markup.inlineKeyboard([
        [Markup.button.callback('Шаг 1', 'toStep1')],
        [Markup.button.callback('Шаг 3', 'toStep3')],
      ]),
    );

    ctx.wizard.next();
  }

  @WizardStep(3)
  protected async step3(@Context() ctx: MyTestContext) {
    ctx.reply(
      'Это шаг 3',
      Markup.inlineKeyboard([
        [Markup.button.callback('Шаг 1', 'toStep1')],
        [Markup.button.callback('Шаг 2', 'toStep2')],
        [Markup.button.callback('Закрыть', 'toStep4')],
      ]),
    );

    ctx.wizard.next();
  }

  @WizardStep(4)
  protected async step4(@Context() ctx: MyTestContext) {
    await this.tryDeleteMessage(ctx);
    ctx.scene.leave();
  }

  @Action('toStep1')
  protected async toStep1(@Context() ctx: MyTestContext) {
    await ctx.answerCbQuery('ахахахахахха гооолллл'); // всплывающее сообщение
    await this.tryDeleteMessage(ctx);

    ctx.wizard.selectStep(1);
    await this.step1(ctx);
  }

  @Action('toStep2')
  protected async toStep2(@Context() ctx: MyTestContext) {
    await this.tryDeleteMessage(ctx);

    ctx.wizard.selectStep(2);
    await this.step2(ctx);
  }

  @Action('toStep3')
  protected async toStep3(@Context() ctx: MyTestContext) {
    await this.tryDeleteMessage(ctx);
    ctx.wizard.selectStep(3);
    await this.step3(ctx);
  }

  @Action('toStep4')
  protected async toStep4(@Context() ctx: MyTestContext) {
    await this.tryDeleteMessage(ctx);
    ctx.wizard.selectStep(4);
    await this.step4(ctx);
  }

  private async tryDeleteMessage(@Context() ctx: MyTestContext) {
    try {
      Logger.log('trying to delete:');
      console.log(ctx.update.callback_query.message);
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    } catch (error) {
      Logger.error(error);
    }
  }
}
