import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './plan.entity';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan) private planRepo: Repository<Plan>,
  ) {}

  async findAll(includeInactive = false): Promise<Plan[]> {
    const where = includeInactive ? {} : { is_active: true };
    return this.planRepo.find({ where, order: { sort_order: 'ASC', created_at: 'ASC' } });
  }

  async findOne(id: string): Promise<Plan> {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Plano não encontrado');
    return plan;
  }

  async create(data: Partial<Plan>): Promise<Plan> {
    const exists = await this.planRepo.findOne({ where: { slug: data.slug } });
    if (exists) throw new ConflictException('Já existe um plano com esse slug');
    const plan = this.planRepo.create(data);
    return this.planRepo.save(plan);
  }

  async update(id: string, data: Partial<Plan>): Promise<Plan> {
    const plan = await this.findOne(id);
    if (data.slug && data.slug !== plan.slug) {
      const exists = await this.planRepo.findOne({ where: { slug: data.slug } });
      if (exists) throw new ConflictException('Já existe um plano com esse slug');
    }
    Object.assign(plan, data);
    return this.planRepo.save(plan);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id);
    await this.planRepo.remove(plan);
  }

  async setFeatured(id: string): Promise<Plan> {
    await this.planRepo.update({}, { is_featured: false });
    const plan = await this.findOne(id);
    plan.is_featured = true;
    return this.planRepo.save(plan);
  }

  async seedDefaultPlans(): Promise<Plan[]> {
    const count = await this.planRepo.count();
    if (count > 0) return this.findAll(true);

    const defaults: Partial<Plan>[] = [
      {
        name: 'Gratuito',
        slug: 'free',
        description: 'Para testar a plataforma sem compromisso.',
        price_monthly: 0,
        price_annual: 0,
        price_lifetime: 0,
        max_agents: 2,
        max_conversations_month: 100,
        max_contacts: 500,
        history_days: 7,
        trial_days: 0,
        color: '#64748b',
        sort_order: 0,
        features: {
          widget_customization: false,
          bot_automation: false,
          knowledge_base: false,
          api_access: false,
          reports_advanced: false,
          multi_sectors: false,
          white_label: false,
          remove_branding: false,
        },
      },
      {
        name: 'Starter',
        slug: 'starter',
        description: 'Ideal para pequenas equipes que querem crescer.',
        price_monthly: 9700,
        price_annual: 87000,
        price_lifetime: 0,
        max_agents: 5,
        max_conversations_month: 1000,
        max_contacts: 5000,
        history_days: 30,
        trial_days: 14,
        color: '#4f46e5',
        sort_order: 1,
        features: {
          widget_customization: true,
          bot_automation: false,
          knowledge_base: true,
          api_access: false,
          reports_advanced: false,
          multi_sectors: true,
          white_label: false,
          remove_branding: false,
          satisfaction_survey: true,
        },
      },
      {
        name: 'Pro',
        slug: 'pro',
        description: 'Para empresas em crescimento com necessidades avançadas.',
        price_monthly: 19700,
        price_annual: 177000,
        price_lifetime: 0,
        max_agents: 20,
        max_conversations_month: 10000,
        max_contacts: 50000,
        history_days: 90,
        trial_days: 14,
        color: '#7c3aed',
        sort_order: 2,
        is_featured: true,
        features: {
          widget_customization: true,
          bot_automation: true,
          knowledge_base: true,
          api_access: true,
          reports_advanced: true,
          multi_sectors: true,
          webhooks: true,
          integrations: true,
          sla_management: true,
          satisfaction_survey: true,
          custom_email: true,
          white_label: false,
          remove_branding: false,
        },
      },
      {
        name: 'Enterprise',
        slug: 'enterprise',
        description: 'Solução completa para grandes operações. Tudo ilimitado.',
        price_monthly: 49700,
        price_annual: 447000,
        price_lifetime: 2470000,
        max_agents: 0,
        max_conversations_month: 0,
        max_contacts: 0,
        history_days: 365,
        trial_days: 30,
        color: '#dc2626',
        sort_order: 3,
        features: {
          widget_customization: true,
          bot_automation: true,
          knowledge_base: true,
          api_access: true,
          reports_advanced: true,
          multi_sectors: true,
          webhooks: true,
          integrations: true,
          sla_management: true,
          satisfaction_survey: true,
          custom_email: true,
          custom_domain: true,
          white_label: true,
          remove_branding: true,
          priority_support: true,
        },
      },
    ];

    const plans = defaults.map(d => this.planRepo.create(d));
    return this.planRepo.save(plans);
  }
}
