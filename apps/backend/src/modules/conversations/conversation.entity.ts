import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Contact } from '../contacts/contact.entity';
import { ContactSession } from '../contacts/contact-session.entity';
import { Sector } from '../companies/sector.entity';

@Entity('conversations')
@Index(['company_id', 'status'])
@Index(['company_id', 'last_message_at'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column({ type: 'uuid' })
  contact_id: string;

  @ManyToOne(() => Contact)
  @JoinColumn({ name: 'contact_id' })
  contact: Contact;

  @Column({ nullable: true, type: 'uuid' })
  assigned_to: string;

  @Column({ nullable: true, type: 'uuid' })
  session_id: string;

  @ManyToOne(() => ContactSession)
  @JoinColumn({ name: 'session_id' })
  session: ContactSession;

  @Column({ default: 'open' })
  status: string;

  @Column({ nullable: true, type: 'uuid' })
  sector_id: string;

  @ManyToOne(() => Sector)
  @JoinColumn({ name: 'sector_id' })
  sector: Sector;

  @Column({ default: 'web_widget' })
  channel: string;

  @Column({ nullable: true })
  subject: string;

  @Column({ default: false })
  is_read: boolean;

  @Column({ default: 0 })
  unread_count: number;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  last_message_at: Date;

  @Column({ nullable: true, length: 500 })
  last_message_preview: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  // Enterprise fields
  @Column({ default: 'normal' })
  priority: string; // low | normal | high | urgent

  @Column({ default: false })
  bot_active: boolean;

  @Column({ nullable: true, type: 'timestamptz' })
  resolved_at: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  waiting_since: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  sla_due_at: Date;

  @Column({ nullable: true, type: 'uuid' })
  channel_id: string;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  csat_score: number; // 1.0 to 5.0

  @Column({ nullable: true, type: 'text' })
  csat_feedback: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
