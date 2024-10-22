import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
// import { TelegramNotifications } from '@src/notifications-factory/telegram/telegram-notifications';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
