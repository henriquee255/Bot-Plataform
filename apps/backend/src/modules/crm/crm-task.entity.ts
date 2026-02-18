import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

@Entity('crm_tasks')
@Index(['company_id', 'contact_id'])
@Index(['company_id', 'due_at'])
@Index(['assigned_to'])
export class CrmTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column({ type: 'uuid' })
  contact_id: string;

  @Column({ nullable: true, type: 'uuid' })
  assigned_to: string;

  @Column({ length: 255 })
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ length: 50, default: 'task' })
  type: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ default: 'normal' })
  priority: string;

  @Column({ nullable: true, type: 'timestamptz' })
  due_at: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  completed_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
