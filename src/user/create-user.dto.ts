export class CreateUserDto {
  gitlabName: string;

  telegramID: number;
}

export class GetUserByTgDto {
  telegramID: number;
}

export class GetUserByGlDto {
  gitlabName: string;
}
