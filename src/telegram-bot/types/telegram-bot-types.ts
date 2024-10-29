import { Context, Scenes } from 'telegraf';
import { Update } from 'telegraf/types';
import { WizardSession, WizardSessionData } from 'telegraf/typings/scenes';

export interface CustomContext extends Context {
  update: Update;
}

interface SessionData {
  groupChatTagsEnabled?: boolean;
  personalMessageNotifications?: boolean;
  notificationsTime?: {
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  };
}

export interface CustomWizardContext extends Scenes.WizardContext {
  update: Update;
  session: SessionData & WizardSession<WizardSessionData>;
}
