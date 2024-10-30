import { ConfigService } from '@nestjs/config';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class PrivateTokenGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers['private-token'];

    if (!token) {
      throw new UnauthorizedException('PRIVATE-TOKEN header is missing');
    }

    const validToken = this.configService.get<string>('GITLAB_TOKEN');

    if (token !== validToken) {
      throw new UnauthorizedException('Invalid PRIVATE-TOKEN');
    }

    return true;
  }
}
