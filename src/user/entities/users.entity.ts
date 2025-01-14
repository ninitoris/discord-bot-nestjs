import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserSettings } from './usersettings.entity';

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: false })
  female: boolean;

  @Column({ nullable: true })
  orgID: string | null;

  @Column()
  gitlabID: number;

  @Column()
  gitlabName: string;

  @Column({ nullable: true })
  discordID: string | null;

  @Column('bigint', { nullable: true })
  telegramID: number | null;

  @Column({ nullable: true })
  telegramUsername: string | null;

  @Column({ nullable: true })
  createdBy: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => UserSettings, (userSettings) => userSettings.user, {
    cascade: true,
  })
  userSettings: UserSettings;
}
