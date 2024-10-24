import { Injectable } from '@nestjs/common';
import type { CreateUserDto } from './create-user.dto';

@Injectable()
export class UserService {
  create(createUserDto: CreateUserDto) {
    return 'add a new user';
  }
}
