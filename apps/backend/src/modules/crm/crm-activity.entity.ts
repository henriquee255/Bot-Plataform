import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, Index,
} from 'typeorm';

@Entity('crm_activities')
@Index(['company_id', 'contact_id'])
@Index(['company_id', 'created_at'])
export class CrmActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column({ type: 'uuid' })
  contact_id: string;

  @Column({ nullable: true, type: 'uuid' })
  user_id: string;

  @Column({ length: 50 })
  type: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;
}
