import { Markup } from 'telegraf';

export enum NavigationButtons {
  notificationsConfig = 'Настроить уведомления',
  regiseter = 'Пройти регистрацию',
}

export const StartMenuText = 'Меню 1';
export const StartMenuMarkup = Markup.inlineKeyboard([
  [
    Markup.button.callback(
      NavigationButtons.notificationsConfig,
      'notifications',
    ),
  ],
  [Markup.button.callback(NavigationButtons.regiseter, 'registerUser')],
]);
