import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('messages')
@Index(['conversation_id', 'created_at'])
@Index(['company_id', 'created_at'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  conversation_id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column()
  sender_type: string;

  @Column({ type: 'uuid' })
  sender_id: string;

  @Column({ default: 'text' })
  content_type: string;

  @Column({ nullable: true, type: 'text' })
  content: string;

  @Column({ type: 'jsonb', default: [] })
  attachments: any[];

  @Column({ default: 'sent' })
  status: string;

  @Column({ nullable: true, type: 'timestamptz' })
  read_at: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  delivered_at: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
