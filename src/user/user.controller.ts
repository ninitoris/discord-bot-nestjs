import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateUserDto } from './create-user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findByID(@Body() telegramID: number) {
    return this.userService.findByTgID(telegramID);
  }

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }
}
