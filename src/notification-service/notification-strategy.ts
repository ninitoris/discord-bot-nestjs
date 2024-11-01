export interface TextWithURL {
  text: string;
  url?: string;
}

export interface GeneralNotificationType {
  /** Заголовок уведомления, который показывает, о чём это сообщение.
   * Пример: МР! @"User" - показывает, что уведомление об МРе
   */
  notificationTitle: string;

  /** Заголовок текста сообщения, связан с эвентом в гитлабе
   * Пример: Кто-то открыл МР
   */
  notificationDescription: TextWithURL;

  /** Описание сообщение, дополнительно погружающее в контекст уведомления */
  additionalInfo: TextWithURL[];

  /** Массив ID-шников пользователей гитлаба, которые получат уведомление в сообщении */
  notifyUsersIDs: Array<number>;
}

export interface NotificationStrategy {
  sendNotification(message: GeneralNotificationType): Promise<void>;
}
