import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class RegistrationRequest {
  @PrimaryGeneratedColumn()
  id: number;

  // ID сообщения в чате для админов, в который прилетают заявки на регистрацию
  @Column('bigint', { nullable: true })
  messageID: number | null;

  @Column()
  status: string;

  @Column()
  name: string;

  @Column()
  female?: boolean;

  @Column()
  orgID: string;

  @Column()
  gitlabName: string;

  @Column()
  gitlabID: number;

  @Column({ nullable: true })
  discordName: string | null;

  @Column('int8', { nullable: true })
  telegramID: number | null;

  @Column({ nullable: true })
  telegramUsername: string | null;

  @Column({ default: 'NEW' })
  createdBy: string = 'NEW';

  @CreateDateColumn()
  createdAt: Date;
}
