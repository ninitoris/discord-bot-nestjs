// TODO: тут должна быть бд через orm-ку, но пока что да

import { Injectable } from '@nestjs/common';

type UserType = {
  /** ID пользоателя в гитлабе */
  gitlabId: number;
  /** ID пользователя в дискорде */
  discordId: string;
  /** Имя Фамилия в жизни */
  irlName: string;

  female?: boolean;
};

@Injectable()
export class GitLabUserService {
  public gitlabUsersMap: Map<number, UserType> = new Map();

  constructor() {
    Object.values(this.usersMap).forEach((user) => {
      this.gitlabUsersMap.set(user.gitlabId, user);
    });
  }

  // зменить на бд
  private readonly usersMap: { [key: string]: UserType } = {
    SSirotinin: {
      gitlabId: 102,
      discordId: '366279169614807040',
      irlName: 'Станислав Сиротинин',
    },
    DOrehov: {
      gitlabId: 113,
      discordId: '184691263684083712',
      irlName: 'Данила Орехов',
    },
    ARomanov: {
      gitlabId: 148,
      discordId: '607905010319360007',
      irlName: 'Александр Романов',
    },
    VGrishchenko: {
      gitlabId: 154,
      discordId: '1143469505591382119',
      irlName: 'Владимир Грищенко',
    },
    yang: {
      gitlabId: 67,
      discordId: '707198326679928872',
      irlName: 'Даниил Янг',
    },
    Volosnikov: {
      gitlabId: 156,
      discordId: '316294777756844044',
      irlName: 'Волосников Никита',
    },
    nslutsker: {
      gitlabId: 162,
      discordId: '385488276800143361',
      irlName: 'Nikita Slutsker',
    },
    YBocharova: {
      gitlabId: 151,
      discordId: '750698318866415667',
      irlName: 'Юлия Бочарова',
      female: true,
    },
    VKochetkov: {
      gitlabId: 149,
      discordId: '495276178324717580',
      irlName: 'Василий Кочетков',
    },
    buhtijarov: {
      gitlabId: 165,
      discordId: '287265168336093184',
      irlName: 'Вадим Бухтияров',
    },
    zolotarev: {
      gitlabId: 166,
      discordId: '917680361977307176',
      irlName: 'Ярослав Золотарёв',
    },
    brysov: {
      gitlabId: 168,
      discordId: '292692053437972480',
      irlName: 'Александр Брысов',
    },
    taranenko: {
      gitlabId: 169,
      discordId: '233660096473726976',
      irlName: 'Даниил Тараненко',
    },
    kulikov: {
      gitlabId: 184,
      discordId: '528154123749687297',
      irlName: 'Алексей Куликов',
    },
    vglukhov: {
      gitlabId: 192,
      discordId: '310679357813161994',
      irlName: 'Вячеслав Глухов',
    },
    zaytsev: {
      gitlabId: 193,
      discordId: '289846650149666816',
      irlName: 'Владимир Зайцев',
    },
    kyakovenko: {
      gitlabId: 208,
      discordId: '640943899723956254',
      irlName: 'Кирилл Яковенко',
    },
    loginov: {
      gitlabId: 203,
      discordId: '523200152215879681',
      irlName: 'Сергей Логинов',
    },
    gorbachev: {
      gitlabId: 202,
      discordId: '1214127894557761641',
      irlName: 'Дмитрий Горбачев',
    },
    slaktushin: {
      gitlabId: 209,
      discordId: '523133685281587219',
      irlName: 'Сергей Лактюшин',
    },
    MPetrushin: {
      gitlabId: 246,
      discordId: '440870098249449483',
      irlName: 'Максим Петрушин',
    },
    AStarostin: {
      gitlabId: 252,
      discordId: '1212054440002191360',
      irlName: 'Андрей Старостин',
    },
    agerasimov: {
      gitlabId: 275,
      discordId: '419122050230386689',
      irlName: 'Александр Герасимов',
    },
    AGaynulin: {
      gitlabId: 307,
      discordId: '244757401259999233',
      irlName: 'Артём Гайнулин',
    },
  };

  private readonly dummyUser: UserType = {
    gitlabId: null,
    discordId: undefined,
    female: false,
    irlName: 'кто-то',
  };

  /** На вход принимается массив строк - username-ы пользователей гитлаба. Юзернейм может иметь @ в начале */
  getDiscordTagsByUserNames(
    usernames: Array<string>,
    /** Высылать ли уведомления. Если true, то возвращает строку, которая будет тэгать пользователей в сообщении. Если false, то возвращает только имена пользователей, чтобы было понятно, кому адресовано сообщение, но уведомления не будет */
    notify: boolean = true,
  ): string | null {
    if (!usernames.length) return null;
    const tags: Array<string> = usernames.map((username) => {
      let cleanedUserName = username;
      if (username.at(0) === '@') {
        cleanedUserName = username.slice(1);
      }
      const tag = this.getDiscordTagByUserName(cleanedUserName, notify);
      if (tag) return tag;
    });
    return tags.join(' ');
  }

  /** На вход принимается строка - username пользователя гитлаба */
  private getDiscordTagByUserName(
    username: string,
    notify: boolean = true,
  ): string | undefined {
    if (notify) {
      const discordId = this.usersMap[username]?.discordId;
      if (!discordId) return undefined;
      return `<@${discordId}>`;
    } else {
      const name = this.usersMap[username]?.irlName;
      if (!name) return;
      return `@${name}`;
    }
  }

  getDiscordTagsByUserIds(
    /** Массив id-шников пользователей гитлаба */
    userIds: Array<number>,
    /** Высылать ли уведомления. Если true, то возвращает строку, которая будет тэгать пользователей в сообщении. Если false, то возвращает только имена пользователей, чтобы было понятно, кому адресовано сообщение, но уведомления не будет */
    notify: boolean = true,
  ): string {
    const tagsArray: Array<string> = userIds.map((userId) => {
      if (this.gitlabUsersMap.has(userId)) {
        if (notify) {
          return `<@${this.gitlabUsersMap.get(userId).discordId.toString()}>`;
        } else return `@${this.gitlabUsersMap.get(userId).irlName}`;
      } else return userId.toString(); // TODO: получить имя пользователя из гитлаба
    });

    return tagsArray.join(' ');
  }

  /** Возвращает либо имя пользователя по его ID, либо заглушку "Кто-то" */
  getUserNameById(userId: number): string | 'Кто-то' {
    return this.gitlabUsersMap.get(userId)?.irlName || 'Кто-то';
  }

  /** Возвращает либо пользователя GitLab по указанному ID, либо пользователя-заглушку */
  getUserById(userId: number): UserType {
    return this.gitlabUsersMap.get(userId) || this.dummyUser;
    // Пользователь-заглушка используется для того, чтобы приложение не падало при отсутствии реального пользователя, например, когда новый сотрудник еще не был добавлен в базу
  }

  isFemale(userId: number): boolean {
    return this.gitlabUsersMap.get(userId)?.female || false;
  }
}
