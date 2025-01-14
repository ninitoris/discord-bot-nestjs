import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENVIRONMENT_KEY } from '@src/constants/env-keys';
import { MessageManager } from '@src/telegram-bot/message-manager/message-manager';
import {
  NavigationButtons,
  StartMenuText,
} from '@src/telegram-bot/telegram-bot.menu';
import { CustomContext } from '@src/telegram-bot/types/telegram-bot-types';
import { Users } from '@src/user/entities/users.entity';
import { UserService } from '@src/user/user.service';
import { Action, Command, Ctx, Hears, Start, Update } from 'nestjs-telegraf';
import { Context, Scenes } from 'telegraf';
import { ExtraEditMessageText } from 'telegraf/typings/telegram-types';
import * as tg from 'telegraf/types';
import { TelegramBotUtils } from './utils/telegram-bot.utils';

@Update()
export class TelegramBotUpdate {
  constructor(
    private readonly mm: MessageManager,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly telegramBotUtils: TelegramBotUtils,
  ) {}

  @Start()
  async start(@Ctx() ctx: Context) {
    console.log('start');
    const chatIsPrivate = await this.mm.chatIsPrivate(ctx);
    console.log('chatIsPrivate', chatIsPrivate);
    if (!chatIsPrivate) return;

    await this.mm.userSentSomething(ctx);
    const startMenu = await this.telegramBotUtils.getStartMenu(
      (ctx.update as tg.Update.MessageUpdate).message.from.id,
    );
    await this.mm.sendNewMessage(ctx, StartMenuText, startMenu);
    this.mm.cleanUpChat(ctx.chat.id);
  }

  @Action('notifications')
  @Hears(NavigationButtons.notificationsConfig)
  @Command('notifications')
  async notificationsSetup(ctx: Scenes.WizardContext) {
    const chatIsPrivate = await this.mm.chatIsPrivate(ctx);
    if (!chatIsPrivate) return;

    await ctx.scene.enter('notificationsSetup');
  }

  @Action('registerUser')
  @Hears(NavigationButtons.regiseter)
  @Command('registerUser')
  async regiseterUser(ctx: Scenes.WizardContext) {
    const chatIsPrivate = await this.mm.chatIsPrivate(ctx);
    if (!chatIsPrivate) return;

    const userID = ctx.callbackQuery.from.id;
    const findExistingRequest =
      await this.userService.registrationRequestExists(userID);
    if (findExistingRequest) {
      const startMenu = await this.telegramBotUtils.getStartMenu(userID);
      await this.mm.msg(
        ctx,
        '🫠 Вы уже отправили заявку на регистрацию.',
        startMenu,
      );
    } else {
      await ctx.scene.enter('registerUser');
    }
  }

  @Action('closeMenu')
  @Hears(NavigationButtons.close)
  @Command('closeMenu')
  async closeMenu(ctx: Scenes.WizardContext) {
    const chatID = ctx.callbackQuery.from.id;
    const msgID = ctx.callbackQuery.message.message_id;
    await this.mm.deleteMessage(chatID, msgID);
  }

  @Action('approveUser')
  async approveUserHandler(@Ctx() ctx: CustomContext) {
    if ('callback_query' in ctx.update) {
      const cbq = ctx.update.callback_query;
      const msgID = cbq.message.message_id;
      const rr =
        await this.userService.getRegistrationRequestByMessageID(msgID);

      // создать пользователя из заявки
      const newUser = new Users();
      newUser.name = rr.name;
      newUser.female = rr.female || false;
      newUser.orgID = rr.orgID;
      newUser.gitlabID = rr.gitlabID;
      newUser.gitlabName = rr.gitlabName;
      newUser.discordID = rr.discordName;
      newUser.telegramID = rr.telegramID;
      newUser.telegramUsername = rr.telegramUsername;
      const createdBy = cbq.from.username;
      newUser.createdBy = createdBy;
      newUser.createdAt = new Date(cbq.message.date * 1000);
      newUser.updatedAt = newUser.createdAt;

      await this.userService.saveUser(newUser);

      rr.status = 'ACCEPTED';
      await this.userService.saveRegistrationRequest(rr);

      // изменить сообщение в чате админов
      const chatId = this.configService.get<number>('CHAT_ID');

      const baseHost = this.configService.get(ENVIRONMENT_KEY.GITLAB_BASE_HOST);
      const userProfileLink = baseHost + rr.gitlabName;

      const messageText = `👀 Пользователь хочет зарегистрироваться\n\n🦊 Ссылка на аккаунт:\n${userProfileLink}\n\n👤 Имя:\n${rr.name}\n\n📱 Телега:\n@${rr.telegramUsername}\n\n🎪 Организация:\n${rr.orgID}\n\n🫵 Пол:\n${rr.female ? 'Женский' : 'Мужской'}\n\n🔔 Получать уведомления в дискорде:\n${rr.discordName ? `Да, на аккаунт ${rr.discordName}` : 'Нет'}\n\n✅ Одобрено: @${createdBy}`;

      const extra: ExtraEditMessageText = {
        link_preview_options: {
          is_disabled: true, // выключил превью ссылок, потому что ссылки на gitlab.interprocom.ru у нас выглядят не очень красиво
        },
      };
      await this.mm.editMessage(chatId, msgID, messageText, extra);

      const telegramID = Number(newUser.telegramID);
      // отправить пользователю сообщение о том, что его заявка одобрена
      const startMenu = await this.telegramBotUtils.getStartMenu(telegramID);
      await this.mm.sendNewMessage(
        telegramID,
        '🎉 Вы успешно прошли регистрацию!',
        startMenu,
      );
      await this.mm.cleanUpChat(telegramID);
    } else {
      Logger.error(
        'approveUser action triggered, but callback_query is not present in ctx.update:',
      );
      console.dir(ctx, { depth: Infinity });
    }
    return;
  }

  @Action('rejectUser')
  async rejectUserHandler(@Ctx() ctx: CustomContext) {
    if ('callback_query' in ctx.update) {
      const cbq = ctx.update.callback_query;
      const msgID = cbq.message.message_id;
      const rr =
        await this.userService.getRegistrationRequestByMessageID(msgID);

      rr.status = 'REJECTED';
      await this.userService.saveRegistrationRequest(rr);

      const rejectedBy = cbq.from.username;

      const baseHost = this.configService.get(ENVIRONMENT_KEY.GITLAB_BASE_HOST);
      const userProfileLink = baseHost + rr.gitlabName;

      const messageText = `👀 Пользователь хочет зарегистрироваться\n\n🦊 Ссылка на аккаунт:\n${userProfileLink}\n\n👤 Имя:\n${rr.name}\n\n📱 Телега:\n@${rr.telegramUsername}\n\n🎪 Организация:\n${rr.orgID}\n\n🫵 Пол:\n${rr.female ? 'Женский' : 'Мужской'}\n\n🔔 Получать уведомления в дискорде:\n${rr.discordName ? `Да, на аккаунт ${rr.discordName}` : 'Нет'}\n\n❌ Отклонено: @${rejectedBy}`;

      const extra: ExtraEditMessageText = {
        link_preview_options: {
          is_disabled: true, // выключил превью ссылок, потому что ссылки на gitlab.interprocom.ru у нас выглядят не очень красиво
        },
      };

      const chatId = this.configService.get<number>('CHAT_ID');
      await this.mm.editMessage(chatId, msgID, messageText, extra);

      // отправить пользователю сообщение о том, что его заявка одобрена
      const telegramID = Number(rr.telegramID);
      const startMenu = await this.telegramBotUtils.getStartMenu(telegramID);
      await this.mm.sendNewMessage(
        telegramID,
        '💀 Вам отклонено в регистрации',
        startMenu,
      );
      await this.mm.cleanUpChat(telegramID);
    }
  }

  @Hears(/.*/)
  protected async onAnyText(@Ctx() ctx: CustomContext) {
    const chatIsPrivate = await this.mm.chatIsPrivate(ctx);
    if (!chatIsPrivate) return;

    await this.mm.userSentSomething(ctx);
  }
}
