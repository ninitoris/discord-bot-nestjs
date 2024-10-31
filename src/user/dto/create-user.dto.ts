import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { UserSettingsDto } from './user-settings.dto';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  gitlabName: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNumber()
  @IsOptional()
  telegramID?: number;

  @IsString()
  @IsOptional()
  telegramUsername?: string;

  @IsString()
  @IsOptional()
  orgID?: string;

  @IsBoolean()
  @IsOptional()
  female?: boolean;

  @IsString()
  @IsOptional()
  createdBy?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserSettingsDto)
  settings?: UserSettingsDto;
}
