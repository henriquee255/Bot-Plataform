import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('quick_replies')
export class QuickReply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column({ length: 50 })
  shortcut: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'global',
  })
  scope: 'individual' | 'sector' | 'global';

  @Column({ type: 'uuid', nullable: true })
  user_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  sector_id: string | null;

  @CreateDateColumn()
  created_at: Date;
}
