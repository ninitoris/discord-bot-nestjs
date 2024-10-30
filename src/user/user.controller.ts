import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getAll() {
    return this.userService.getAllUsers();
  }

  @Get('gitlab/:username')
  findByGitlab(@Param('username') gitlabName: string) {
    return this.userService.findByGitlabName(gitlabName);
  }

  @Get('telegram/:id')
  findByTelegram(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findByTelegram(id);
  }

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }
}
