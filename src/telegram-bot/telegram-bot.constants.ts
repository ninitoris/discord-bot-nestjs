import { Markup } from 'telegraf';

export enum NavigationButtons {
  notificationsConfig = 'Настроить уведомления',
}

export const StartMenuText = 'Меню 1';
export const StartMenuMarkup = Markup.inlineKeyboard([
  [
    Markup.button.callback(
      NavigationButtons.notificationsConfig,
      'notifications',
    ),
  ],
  [
    Markup.button.callback('Кнопка 2', 'btn2'),
    Markup.button.callback('Кнопка 3', 'btn2'),
  ],
  [Markup.button.callback('Кнопка 4', 'btn2')],
]);
