import { GeneralNotificationType } from '@src/notification-service/notification-strategy';

export interface DiscordNotificationType extends GeneralNotificationType {
  /** Цвет, в который будет окрашен embed */
  embedColor?: number;

  /** Ссылка на картинку, которая будет использована в качесве аватарки */
  avatarURL?: string;

  /** Как будет подписан пользователь, который отправил сообщение */
  username: string;
}
