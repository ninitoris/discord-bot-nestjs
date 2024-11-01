import { Markup } from 'telegraf';

export enum NavigationButtons {
  notificationsConfig = '🔔 Настроить уведомления',
  regiseter = '🫂 Пройти регистрацию',
}

export const StartMenuText = 'Вы попали в бота уведомлений gitlab 🦊 ';
export const StartMenuMarkup = Markup.inlineKeyboard([
  [
    Markup.button.callback(
      NavigationButtons.notificationsConfig,
      'notifications',
    ),
  ],
  [Markup.button.callback(NavigationButtons.regiseter, 'registerUser')],
]);
