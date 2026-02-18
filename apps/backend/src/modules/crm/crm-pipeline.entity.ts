import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

export interface CrmStage {
  id: string;
  name: string;
  color: string;
  order: number;
  win_probability?: number;
}

@Entity('crm_pipelines')
@Index(['company_id'])
export class CrmPipeline {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ nullable: true, length: 500 })
  description: string;

  @Column({ type: 'jsonb', default: [] })
  stages: CrmStage[];

  @Column({ default: true })
  is_default: boolean;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
