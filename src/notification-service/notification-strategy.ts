export interface GeneralNotificationType {
  /** Заголовок уведомления, который показывает, о чём это сообщение.
   * Пример: МР! @"User" - показывает, что уведомление об МРе
   */
  notificationTitle: string;

  /** Заголовок текста сообщения, связан с эвентом в гитлабе
   * Пример: Кто-то открыл МР
   */
  notificationSubject: string;

  /** Описание сообщение, дополнительно погружающее в контекст уведомления */
  notificationDescription: string;

  /** Ссылка, которая будет прикреплена к уведомлению */
  notificationUrl?: string;
}

export interface NotificationStrategy {
  sendNotification(message: GeneralNotificationType): Promise<void>;
}
