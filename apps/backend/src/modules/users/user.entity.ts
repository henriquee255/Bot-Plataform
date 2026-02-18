import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from '../companies/company.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 255 })
  password_hash: string;

  @Column({ length: 255 })
  full_name: string;

  @Column({ length: 50, default: 'agent' })
  role: 'agent' | 'supervisor' | 'manager' | 'admin';

  @Column({ default: false })
  is_superadmin: boolean;

  @Column({ length: 50, default: 'active' })
  status: 'active' | 'blocked';

  @Column({ nullable: true, type: 'text' })
  avatar_url: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true, type: 'timestamptz' })
  last_seen_at: Date;

  @Column({ type: 'jsonb', nullable: true, default: null })
  work_schedule: {
    enabled: boolean;
    timezone: string;
    shifts: {
      day: string;
      start: string;
      end: string;
      active: boolean;
    }[];
  } | null;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
