import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column({ nullable: true })
  telegramID: number | null;

  @Column({ nullable: true })
  telegramUsername: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
