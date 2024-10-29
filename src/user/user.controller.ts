import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateUserDto, GetUserByTgDto } from './create-user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findByID(@Body() getUserDto: GetUserByTgDto) {
    return this.userService.findByTgID(getUserDto);
  }

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }
}
