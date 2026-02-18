import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type TriggerType = 'first_message' | 'keyword' | 'new_conversation';

export interface BotStep {
  type: 'message' | 'assign' | 'tag' | 'close';
  value?: string;
  delay?: number; // seconds
}

@Entity('bot_flows')
export class BotFlow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 50 })
  trigger_type: TriggerType;

  @Column({ nullable: true, length: 255 })
  trigger_value: string;

  @Column({ type: 'jsonb', default: [] })
  steps: BotStep[];

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
