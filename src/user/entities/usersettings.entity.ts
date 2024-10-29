import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from './users.entity';

@Entity()
export class UserSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Users, (user) => user.userSettings)
  @JoinColumn()
  user: Users;

  @Column({ default: false })
  useTelegram: boolean;

  @Column({ default: false })
  useDiscord: boolean;

  @Column({ default: false })
  tgGroupChatNotify: boolean;

  @Column({ default: false })
  tgPrivateMessageNotify: boolean;
}
