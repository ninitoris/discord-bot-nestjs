import { IsBoolean, IsOptional } from 'class-validator';

export class UserSettingsDto {
  @IsOptional()
  @IsBoolean()
  useTelegram?: boolean;

  @IsOptional()
  @IsBoolean()
  useDiscord?: boolean;

  @IsOptional()
  @IsBoolean()
  tgGroupChatNotify?: boolean;

  @IsOptional()
  @IsBoolean()
  tgPrivateMessageNotify?: boolean;
}
