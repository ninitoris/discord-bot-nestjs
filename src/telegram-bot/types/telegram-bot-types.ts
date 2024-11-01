import { Context, Scenes } from 'telegraf';
import { Update } from 'telegraf/types';
import { WizardSession, WizardSessionData } from 'telegraf/typings/scenes';
import Chat from 'telegraf/typings/types';
import { UserInfo } from '../../gitlab-webhook/gitlab-webhook.types';
import * as tg from 'telegraf/types';

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

export interface RegisterData {
  gitlabName: string;
  name: string;
  telegramID?: number;
  telegramUsername?: string;
  orgID?: string;
  discordName?: string;
  female?: boolean;
  userInfo?: UserInfo;
  createdBy?: string;
}

export interface RegisterWizardContext extends Scenes.WizardContext {
  update: Update;
  session: RegisterData & WizardSession<WizardSessionData>;
  chat: Chat.Chat & Username;
}

export interface ChatContext extends Context {
  chat: Chat.Chat & Partial<Username>;
}

type Username = {
  username: string;
};

export type ExtraWithNewUser =
  | (tg.Convenience.ExtraReplyMessage & { newUser: RegisterData })
  | (tg.Convenience.ExtraEditMessageText & { newUser: RegisterData });
