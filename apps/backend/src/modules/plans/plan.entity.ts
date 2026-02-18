import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  /** Preço mensal em centavos (ex: 9700 = R$97,00) */
  @Column({ type: 'int', default: 0 })
  price_monthly: number;

  /** Preço anual em centavos */
  @Column({ type: 'int', default: 0 })
  price_annual: number;

  /** Preço vitalício em centavos */
  @Column({ type: 'int', default: 0 })
  price_lifetime: number;

  /** Número máximo de agentes (0 = ilimitado) */
  @Column({ default: 3 })
  max_agents: number;

  /** Conversas por mês (0 = ilimitado) */
  @Column({ default: 1000 })
  max_conversations_month: number;

  /** Contatos armazenados (0 = ilimitado) */
  @Column({ default: 5000 })
  max_contacts: number;

  /** Dias de retenção do histórico */
  @Column({ default: 30 })
  history_days: number;

  /** Dias de trial gratuito */
  @Column({ default: 0 })
  trial_days: number;

  /** Features incluídas no plano */
  @Column({ type: 'simple-json', default: '{}' })
  features: {
    widget_customization?: boolean;
    custom_domain?: boolean;
    api_access?: boolean;
    webhooks?: boolean;
    bot_automation?: boolean;
    knowledge_base?: boolean;
    reports_advanced?: boolean;
    multi_sectors?: boolean;
    integrations?: boolean;
    sla_management?: boolean;
    priority_support?: boolean;
    white_label?: boolean;
    remove_branding?: boolean;
    custom_email?: boolean;
    satisfaction_survey?: boolean;
  };

  /** Plano está ativo para novas assinaturas */
  @Column({ default: true })
  is_active: boolean;

  /** Destacar como plano recomendado */
  @Column({ default: false })
  is_featured: boolean;

  /** Ordem de exibição */
  @Column({ default: 0 })
  sort_order: number;

  /** Cor de destaque (hex) */
  @Column({ length: 20, default: '#4f46e5' })
  color: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
