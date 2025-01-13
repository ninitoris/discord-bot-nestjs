import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class TgBotMessages {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('bigint')
  userID: number;

  @Column('bigint')
  chatID: number;

  @Column({
    type: 'enum',
    enum: ['bot', 'user'],
  })
  messageType: 'bot' | 'user';

  @Column('text', { nullable: true })
  messageText: string | null;

  @Column('bigint')
  messageID: number;

  @CreateDateColumn()
  timestamp: Date;

  @Column('varchar')
  status: string;

  @DeleteDateColumn()
  deletedAt: Date;
}
