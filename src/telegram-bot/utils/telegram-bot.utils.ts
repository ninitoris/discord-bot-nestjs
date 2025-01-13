import { UserService } from '@src/user/user.service';
import { Markup } from 'telegraf';
import { InlineKeyboardMarkup } from 'telegraf/types';
import { Markup as MarkupType } from 'telegraf/typings/telegram-types';
import { NavigationButtons } from '../telegram-bot.menu';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TelegramBotUtils {
  constructor(private readonly userService: UserService) {}

  async getStartMenu(
    userTelegramID: number,
  ): Promise<MarkupType<InlineKeyboardMarkup>> {
    const inlineKeyboardButtons = [];

    const userExists = await this.userService.userExists(userTelegramID);
    if (userExists) {
      inlineKeyboardButtons.push([
        Markup.button.callback(
          NavigationButtons.notificationsConfig,
          'notifications',
        ),
      ]);
    } else {
      // если пользователь еще не зарегистрирован, то отправить кнопку с регистрацией
      inlineKeyboardButtons.push([
        Markup.button.callback(NavigationButtons.regiseter, 'registerUser'),
      ]);
    }
    inlineKeyboardButtons.push([
      Markup.button.callback(NavigationButtons.close, 'closeMenu'),
    ]);
    return Markup.inlineKeyboard(inlineKeyboardButtons);
  }
}
