import { Module } from '@nestjs/common';
import { DiscordNotificationService } from '@src/discord-notification/discord-notification.service';

@Module({
  providers: [DiscordNotificationService],
  exports: [DiscordNotificationService],
})
export class DiscordNotificationModule {}
