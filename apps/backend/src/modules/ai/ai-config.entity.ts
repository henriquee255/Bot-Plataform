import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('ai_configs')
export class AiConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company_id: string;

  @Column({ default: 'openai' })
  provider: string; // openai | gemini | anthropic | groq | cohere

  @Column({ nullable: true })
  api_key: string;

  @Column({ nullable: true })
  model: string;

  @Column({ type: 'text', nullable: true })
  system_prompt: string;

  @Column({ default: false })
  enabled: boolean;

  @Column({ default: true })
  use_knowledge_base: boolean;

  @Column({ default: false })
  auto_respond: boolean;

  @Column({ type: 'float', default: 0.7 })
  temperature: number;

  @Column({ default: 1000 })
  max_tokens: number;

  @Column({ type: 'simple-array', nullable: true })
  trigger_keywords: string[];

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  updated_at: Date;
}
