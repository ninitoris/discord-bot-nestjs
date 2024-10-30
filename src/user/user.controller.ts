import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { PrivateTokenGuard } from './guards/user.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(PrivateTokenGuard)
  getAll() {
    return this.userService.getAllUsers();
  }

  @Get('gitlab/:username')
  @UseGuards(PrivateTokenGuard)
  findByGitlab(@Param('username') gitlabName: string) {
    return this.userService.findByGitlabName(gitlabName);
  }

  @Get('telegram/:id')
  @UseGuards(PrivateTokenGuard)
  findByTelegram(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findByTelegram(id);
  }

  @Post()
  @UseGuards(PrivateTokenGuard)
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }
}
