import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('contact_sessions')
export class ContactSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column({ nullable: true, type: 'uuid' })
  contact_id: string;

  @Column({ unique: true })
  session_token: string;

  @Column({ default: 'web' })
  channel: string;

  @Column({ nullable: true })
  domain: string;

  @Column({ nullable: true, length: 2000 })
  last_url: string;

  @Column({ nullable: true, length: 2000 })
  referrer: string;

  @Column({ nullable: true, type: 'text' })
  user_agent: string;

  @Column({ nullable: true })
  ip_address: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
