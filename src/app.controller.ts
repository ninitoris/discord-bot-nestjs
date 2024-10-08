import { Controller, Get, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Request, Response } from 'express';
import { TelegramBotTest } from './telegram';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('tg')
  testTg(@Req() req: Request, @Res() res: Response) {
    console.log('gol');
    const telegram = new TelegramBotTest();
    telegram.sendMsgInGroupChat();
    return res.status(200);
  }
}
