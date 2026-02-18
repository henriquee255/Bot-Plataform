import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Company } from '../companies/company.entity';

export type ChannelType = 'web_widget' | 'whatsapp_meta' | 'whatsapp_baileys' | 'whatsapp_qr' | 'telegram' | 'instagram' | 'email';
export type ChannelStatus = 'active' | 'inactive' | 'connecting' | 'error';

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 50 })
  type: ChannelType;

  @Column({ length: 20, default: 'inactive' })
  status: ChannelStatus;

  @Column({ type: 'simple-json', default: '{}' })
  config: Record<string, any>;

  @Column({ length: 500, nullable: true })
  webhook_url: string;

  @Column({ type: 'simple-json', default: '{}' })
  metadata: Record<string, any>;

  @Column({ default: false })
  is_default: boolean;

  @Column({ type: 'uuid', nullable: true })
  sector_id: string | null;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ nullable: true })
  instance_code: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
