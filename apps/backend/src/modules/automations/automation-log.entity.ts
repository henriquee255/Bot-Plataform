import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, Index,
} from 'typeorm';

@Entity('automation_logs')
@Index(['company_id', 'automation_id'])
@Index(['company_id', 'created_at'])
export class AutomationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column({ type: 'uuid' })
  automation_id: string;

  @Column({ nullable: true, type: 'uuid' })
  conversation_id: string;

  @Column({ nullable: true, type: 'uuid' })
  contact_id: string;

  @Column({ default: 'success' })
  status: string;

  @Column({ type: 'jsonb', default: [] })
  actions_executed: Record<string, any>[];

  @Column({ nullable: true, type: 'text' })
  error_message: string;

  @CreateDateColumn()
  created_at: Date;
}
