type UserType = {
  /** ID пользоателя в гитлабе */
  gitlabId: number;
  /** ID пользователя в дискорде */
  discordId?: string;
  /** Имя Фамилия в жизни */
  irlName: string;

  female?: boolean;

  telegramID?: number;
  telegramUsername?: string;
};

export class GitLabUserService {
  constructor() {}

  private readonly usersMap: { [key: string]: UserType } = {
    SSirotinin: {
      gitlabId: 102,
      discordId: '366279169614807040',
      irlName: 'Станислав Сиротинин',
      telegramUsername: 'ninitoris',
      telegramID: 451810887,
    },
    DOrehov: {
      gitlabId: 113,
      discordId: '184691263684083712',
      telegramUsername: 'tylys',
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
      irlName: 'Никита Слуцкер',
      telegramUsername: 'nikifre',
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
      telegramUsername: 'shad0w_storm',
    },
    buhtijarov: {
      gitlabId: 165,
      discordId: '287265168336093184',
      irlName: 'Вадим Бухтияров',
      telegramUsername: 'heiwa_local',
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
      telegramUsername: 'kulikrch',
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
      telegramUsername: 'dev0ping',
    },
    AGaynulin: {
      gitlabId: 307,
      discordId: '244757401259999233',
      irlName: 'Артём Гайнулин',
    },
    ISlobodyan: {
      gitlabId: 314,
      discordId: '1283345047286190155',
      irlName: 'Илья Слободян',
    },
    /**
     * CLICK USERS
     */
    kiselev: {
      gitlabId: 170,
      discordId: '1070013193595928656',
      irlName: 'Дмитрий Киселев',
    },
    malinin: {
      gitlabId: 199,
      discordId: '160462087938768896',
      irlName: 'Малинин Андрей',
    },
    uskov: {
      gitlabId: 251,
      discordId: '1252891329466204194',
      irlName: 'Усков Иван',
    },
    dsavchenko: {
      gitlabId: 241,
      discordId: '297753937371594752',
      irlName: 'Денис Савченко',
    },
    pospelova: {
      gitlabId: 189,
      discordId: '1204727201451347989',
      irlName: 'Людмила Поспелова',
    },
    safonov: {
      gitlabId: 227,
      discordId: '393104471002972170',
      irlName: 'Иван Сафонов',
    },
    papin: {
      gitlabId: 218,
      discordId: '711598511023587328',
      irlName: 'Семён Папин',
    },
    ihasanov: {
      gitlabId: 228,
      discordId: '1231884490805350452',
      irlName: 'Игорь Хасанов',
    },
    anazarenko: {
      gitlabId: 191,
      discordId: '645689994224205856',
      irlName: 'Антон Назаренко',
    },
    nikolaev: {
      gitlabId: 177,
      discordId: '711844639463964762',
      irlName: 'Pavel Nikolaev',
    },
    sotonkin: {
      gitlabId: 176,
      discordId: '1188807860579209247',
      irlName: 'Евгений Сотонкин',
    },
    askoromnyuk: {
      gitlabId: 198,
      discordId: '735064930503360542',
      irlName: 'Александр Скоромнюк',
    },
    aglinov: {
      gitlabId: 235,
      discordId: '1161903426343555094',
      irlName: 'Александр Глинов',
    },
  };
}
