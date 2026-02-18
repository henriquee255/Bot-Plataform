import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ type: 'uuid', unique: true, default: () => 'gen_random_uuid()' })
  widget_key: string;

  @Column({ length: 50, default: 'active' })
  status: 'active' | 'suspended';

  @Column({ length: 50, default: 'free' })
  plan: 'free' | 'monthly' | 'annual' | 'lifetime';

  @Column({ type: 'timestamptz', nullable: true })
  plan_expires_at: Date | null;

  @Column({ default: 3 })
  max_agents: number;

  @Column({ length: 255, nullable: true })
  custom_domain: string;

  @Column({ type: 'jsonb', default: {} })
  branding: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    favicon_url?: string;
  };

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  widget_config: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
