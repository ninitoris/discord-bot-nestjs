import { UtilsService } from '@src/utils/utils.service';
import {
  Action,
  Command,
  Context,
  Hears,
  Wizard,
  WizardStep,
} from 'nestjs-telegraf';
import { Markup, Scenes } from 'telegraf';
import { MessageManager } from '@src/telegram-bot/message-manager/message-manager';
import { CustomWizardContext } from '@src/telegram-bot/types/telegram-bot-types';
import {
  StartMenuMarkup,
  StartMenuText,
} from '@src/telegram-bot/telegram-bot.constants';

enum Steps {
  groupChatNotify = 0,
  privateMessageNotify = 1,
  stepGoToTimeConfiguration = 2,
  selectTimeStep = 3,
  inputTimeStep = 4,
  confirmation = 5,
}

@Wizard('notificationsSetup')
export class NotificationsSetupWizard {
  constructor(
    private readonly utilsService: UtilsService,
    private readonly mm: MessageManager,
  ) {}

  @WizardStep(Steps.groupChatNotify)
  protected async groupChatNotify(@Context() ctx: Scenes.WizardContext) {
    const msgText =
      'Выберите формат упоминаний вашего имени в групповом чате.\n\nУведомления будут приходить в чат в любом случае, но если вы включите упоминания в формате @username, то будете получать специальные уведомления.';

    const msgButtons = Markup.inlineKeyboard([
      [
        Markup.button.callback('@username', 'enableTags'),
        Markup.button.callback('Имя Фамилия', 'disableTags'),
      ],
    ]);

    this.mm.msg(ctx, msgText, msgButtons);
  }

  @Action('enableTags')
  protected async enableTagsAction(@Context() ctx: CustomWizardContext) {
    ctx.session.groupChatTagsEnabled = true;

    await this.privateMessageNotify(ctx);
  }

  @Action('disableTags')
  protected async disableTagsAction(@Context() ctx: CustomWizardContext) {
    ctx.session.groupChatTagsEnabled = false;

    await this.privateMessageNotify(ctx);
  }

  @WizardStep(Steps.privateMessageNotify)
  protected async privateMessageNotify(@Context() ctx: CustomWizardContext) {
    await this.mm.msg(
      ctx,
      'Дублировать уведомления в личные сообщения?\n\nЕсли включено, то все уведомления, которые должны упомянать вас, будут отправляться и в общий чат, и в этот',
      Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Включить', 'enableDuplicate'),
          Markup.button.callback('❌ Выключить', 'disableDuplicate'),
        ],
      ]),
    );
  }

  @Action('enableDuplicate')
  protected async enableDuplicate(@Context() ctx: CustomWizardContext) {
    ctx.session.personalMessageNotifications = true;

    await this.goToTimeConfiguration(ctx);
  }

  @Action('disableDuplicate')
  protected async disableDuplicate(@Context() ctx: CustomWizardContext) {
    ctx.session.personalMessageNotifications = false;

    await this.goToTimeConfiguration(ctx);
  }

  @WizardStep(Steps.stepGoToTimeConfiguration)
  protected async goToTimeConfiguration(@Context() ctx: CustomWizardContext) {
    const { groupChatTagsEnabled, personalMessageNotifications } = ctx.session;

    if (groupChatTagsEnabled || personalMessageNotifications) {
      await this.selectTimeStep(ctx);
    } else {
      ctx.wizard.selectStep(Steps.confirmation);
      await this.confirmation(ctx);
    }
  }

  @WizardStep(Steps.selectTimeStep)
  protected async selectTimeStep(@Context() ctx: CustomWizardContext) {
    const { groupChatTagsEnabled, personalMessageNotifications } = ctx.session;
    let msg = 'Выберите время, в которое вы хотите получать уведомления.\n\n';

    if (groupChatTagsEnabled) {
      msg +=
        'Уведомления в групповом чате будут упомянать вас только в указанное время, а в остальное - упоминания будут отправляться в формате @Имя Фамилия.\n';
    }
    // TODO: отсроченная доствка уведомлений в личку
    if (personalMessageNotifications) {
      msg +=
        'Уведомления в личные сообщения будут приходить только в указанное время, а уведомления, отправленные в другое время - пока что не будут приходить вообще. (когда-нибудь сделаем отсроченную доствку уведомлений)\n';
    }

    await this.mm.msg(
      ctx,
      msg,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            'с 9:00 до 19:00',
            'setDefaultNotificationsTime',
          ),
          Markup.button.callback('Ввести своё время', 'inputTime'),
        ],
      ]),
    );
  }

  @Action('setDefaultNotificationsTime')
  protected async setDefaultNotificationsTime(
    @Context() ctx: CustomWizardContext,
  ) {
    ctx.session.notificationsTime = {
      startHour: 9,
      startMinute: 0,
      endHour: 19,
      endMinute: 0,
    };

    ctx.wizard.selectStep(Steps.confirmation);
    await this.confirmation(ctx);
  }

  @Action('inputTime')
  protected async inputTime(@Context() ctx: CustomWizardContext) {
    await this.mm.msg(
      ctx,
      'Введите время в формате "12:34-23:59" (по умолчанию - 09:00-19:00)',
    );

    ctx.wizard.selectStep(Steps.inputTimeStep);
  }

  @WizardStep(Steps.inputTimeStep)
  protected async inputTimeStep(@Context() ctx: CustomWizardContext) {
    if (!('message' in ctx.update && 'text' in ctx.update.message)) {
      // ctx.deleteMessage();
      return;
    }
    const userInput = ctx.update.message.text;

    this.mm.userSentSomething(ctx);

    let timeIsValid: boolean = true;
    const [start, end] = userInput.split('-').map((time) => {
      const [hour, minute] = time.split(':').map(Number);
      timeIsValid = this.utilsService.isTimeValid(hour, 'hour');
      timeIsValid = this.utilsService.isTimeValid(minute, 'minute');
      return { hour, minute };
    });

    if (!timeIsValid) {
      await this.mm.msg(
        ctx,
        `Вы ввели невалидное время ${userInput}\n\nВведите время в формате "12:34-23:59" (по умолчанию - 09:00-19:00)\n\nДля выхода введите /exit`,
      );
      ctx.wizard.selectStep(Steps.inputTimeStep);
      return;
    }

    ctx.session.notificationsTime = {
      startHour: start.hour,
      startMinute: start.minute,
      endHour: end.hour,
      endMinute: end.minute,
    };

    ctx.wizard.selectStep(Steps.confirmation);
    await this.confirmation(ctx);
  }

  @WizardStep(Steps.confirmation)
  protected async confirmation(@Context() ctx: CustomWizardContext) {
    const {
      groupChatTagsEnabled,
      personalMessageNotifications,
      notificationsTime,
    } = ctx.session;

    let confirmMessage = `Упоминания в чате: ${groupChatTagsEnabled ? 'включены' : 'выключены'}.\nУведомления в личные сообщения: ${personalMessageNotifications ? 'включены' : 'выключены'}\n\n`;

    if (groupChatTagsEnabled || personalMessageNotifications) {
      const pad = (num: number): string => {
        if (num >= 0 && num <= 9) return '0' + num;
        return num.toString();
      };

      const { startHour, startMinute, endHour, endMinute } = notificationsTime;

      confirmMessage += `Уведомления будут приходить с понедельника по пятницу с ${pad(startHour)}:${pad(startMinute)} до ${pad(endHour)}:${pad(endMinute)}`;
    }

    await this.mm.msg(
      ctx,
      confirmMessage,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('Подтвердить', 'confirm'),
          Markup.button.callback('Отмена', 'cancel'),
        ],
      ]),
    );
  }

  @Action('confirm')
  protected async confirm(@Context() ctx: CustomWizardContext) {
    // TODO: включить или выключить тэги для этого пользователя
    // TODO: включить или выключить личные уведомления в телеге для этого пользователя
    // TODO: установить время пользователя в бд типо

    ctx.scene.leave();
    await this.mm.msg(ctx, StartMenuText, StartMenuMarkup);
  }

  @Action('cancel') // это экшен, который висит на кнопке "отмена"
  protected async exit(@Context() ctx: CustomWizardContext) {
    await this.mm.msg(ctx, StartMenuText, StartMenuMarkup);
    await ctx.scene.leave();
  }

  @Command('exit')
  protected async exitCommand(@Context() ctx: CustomWizardContext) {
    await this.mm.sendNewMessage(ctx, StartMenuText, StartMenuMarkup);
    await this.mm.userSentSomething(ctx);
    await this.mm.cleanUpChat(ctx.chat.id);
    await ctx.scene.leave();
  }

  @Hears(/.*/)
  protected async onAnyText(@Context() ctx: CustomWizardContext) {
    if (ctx.wizard.cursor === Steps.inputTimeStep) {
      return await this.inputTimeStep(ctx);
    }
    await this.mm.userSentSomething(ctx);
    await this.mm.sendNewMessage(ctx, 'Для выхода введите /exit');
  }
}
