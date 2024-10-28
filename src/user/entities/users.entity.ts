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

  @Column()
  orgID: string;

  @Column()
  gitlabID: number;

  @Column()
  gitlabName: string;

  @Column({ nullable: true })
  discordID: string | null;

  @Column()
  telegramID: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
