import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

export type AutomationTrigger =
  | 'conversation_created'
  | 'first_message_received'
  | 'message_received'
  | 'conversation_assigned'
  | 'conversation_resolved'
  | 'conversation_waiting'
  | 'outside_business_hours'
  | 'keyword_detected'
  | 'contact_created'
  | 'inactivity'
  | 'csat_submitted';

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty' | 'greater_than' | 'less_than';
  value: any;
}

export interface AutomationAction {
  type: 'send_message' | 'assign_agent' | 'assign_sector' | 'add_tag' | 'remove_tag' | 'resolve_conversation' | 'set_priority' | 'move_crm_stage' | 'send_webhook' | 'add_note';
  params: Record<string, any>;
  delay_seconds?: number;
}

@Entity('automations')
@Index(['company_id', 'is_active'])
@Index(['company_id', 'trigger'])
export class Automation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ nullable: true, length: 500 })
  description: string;

  @Column({ length: 100 })
  trigger: string;

  @Column({ type: 'jsonb', default: {} })
  trigger_config: Record<string, any>;

  @Column({ type: 'jsonb', default: [] })
  conditions: AutomationCondition[];

  @Column({ length: 10, default: 'AND' })
  conditions_operator: string;

  @Column({ type: 'jsonb', default: [] })
  actions: AutomationAction[];

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  run_count: number;

  @Column({ nullable: true, type: 'timestamptz' })
  last_run_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
