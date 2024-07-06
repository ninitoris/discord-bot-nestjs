import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class GitlabMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    // запрос обработан, отдаем 201.
    // это согласно документации https://gitlab.interprocom.ru/help/user/project/integrations/webhooks#configure-your-webhook-receiver-endpoint
    res.status(201).send();
    next();
  }
}
