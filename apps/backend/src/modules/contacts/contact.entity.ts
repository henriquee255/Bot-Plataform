import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('contacts')
@Index(['company_id', 'created_at'])
@Index(['company_id', 'crm_stage'])
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  full_name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true, type: 'text' })
  avatar_url: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  // CRM fields
  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ nullable: true, length: 100 })
  source: string; // website, social_media, referral, search, direct, whatsapp, etc.

  @Column({ nullable: true, length: 100 })
  crm_stage: string; // lead, qualified, proposal, negotiation, won, lost, etc.

  @Column({ nullable: true, type: 'uuid' })
  crm_pipeline_id: string;

  @Column({ nullable: true, length: 100 })
  crm_stage_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  lead_value: number;

  @Column({ default: false })
  is_lead: boolean;

  @Column({ nullable: true, length: 500 })
  notes: string;

  @Column({ type: 'jsonb', default: {} })
  custom_fields: Record<string, any>;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  first_seen_at: Date;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  last_seen_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
