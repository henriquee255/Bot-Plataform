import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Automation, AutomationCondition, AutomationAction } from './automation.entity';
import { AutomationLog } from './automation-log.entity';

@Injectable()
export class AutomationsService {
  constructor(
    @InjectRepository(Automation) private automationRepo: Repository<Automation>,
    @InjectRepository(AutomationLog) private logRepo: Repository<AutomationLog>,
  ) {}

  async list(companyId: string): Promise<Automation[]> {
    return this.automationRepo.find({
      where: { company_id: companyId },
      order: { created_at: 'DESC' },
    });
  }

  async get(companyId: string, id: string): Promise<Automation> {
    const automation = await this.automationRepo.findOne({ where: { id, company_id: companyId } });
    if (!automation) throw new NotFoundException('Automação não encontrada');
    return automation;
  }

  async create(companyId: string, data: Partial<Automation>): Promise<Automation> {
    const automation = this.automationRepo.create({ ...data, company_id: companyId });
    return this.automationRepo.save(automation);
  }

  async update(companyId: string, id: string, data: Partial<Automation>): Promise<Automation> {
    const automation = await this.get(companyId, id);
    Object.assign(automation, data, { updated_at: new Date() });
    return this.automationRepo.save(automation);
  }

  async delete(companyId: string, id: string): Promise<void> {
    await this.automationRepo.delete({ id, company_id: companyId });
  }

  async toggle(companyId: string, id: string): Promise<Automation> {
    const automation = await this.get(companyId, id);
    automation.is_active = !automation.is_active;
    automation.updated_at = new Date();
    return this.automationRepo.save(automation);
  }

  async getLogs(companyId: string, automationId: string, limit = 50): Promise<AutomationLog[]> {
    return this.logRepo.find({
      where: { company_id: companyId, automation_id: automationId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async getStats(companyId: string): Promise<any> {
    const total = await this.automationRepo.count({ where: { company_id: companyId } });
    const active = await this.automationRepo.count({ where: { company_id: companyId, is_active: true } });
    const totalRuns = await this.logRepo.count({ where: { company_id: companyId } });
    const successRuns = await this.logRepo.count({ where: { company_id: companyId, status: 'success' } });

    return {
      total,
      active,
      inactive: total - active,
      total_runs: totalRuns,
      success_rate: totalRuns > 0 ? (successRuns / totalRuns) * 100 : 0,
    };
  }

  // ── Event Handler ──────────────────────────────────────────────────

  @OnEvent('automation.trigger')
  async handleTrigger(payload: {
    companyId: string;
    trigger: string;
    context: Record<string, any>;
  }) {
    const automations = await this.automationRepo.find({
      where: {
        company_id: payload.companyId,
        trigger: payload.trigger,
        is_active: true,
      },
    });

    for (const automation of automations) {
      await this.evaluateAndRun(automation, payload.context).catch(() => {});
    }
  }

  private async evaluateAndRun(automation: Automation, context: Record<string, any>): Promise<void> {
    try {
      const conditionsMet = this.evaluateConditions(
        automation.conditions,
        automation.conditions_operator as 'AND' | 'OR',
        context,
      );
      if (!conditionsMet) return;

      const actionsExecuted: any[] = [];
      for (const action of automation.actions) {
        actionsExecuted.push({ action: action.type, params: action.params, executed: true });
      }

      automation.run_count = (automation.run_count || 0) + 1;
      automation.last_run_at = new Date();
      await this.automationRepo.save(automation);

      await this.logRepo.save(this.logRepo.create({
        company_id: automation.company_id,
        automation_id: automation.id,
        conversation_id: context.conversationId,
        contact_id: context.contactId,
        status: 'success',
        actions_executed: actionsExecuted,
      }));
    } catch (error: any) {
      await this.logRepo.save(this.logRepo.create({
        company_id: automation.company_id,
        automation_id: automation.id,
        conversation_id: context.conversationId,
        contact_id: context.contactId,
        status: 'failed',
        actions_executed: [],
        error_message: error.message,
      }));
    }
  }

  private evaluateConditions(
    conditions: AutomationCondition[],
    operator: 'AND' | 'OR',
    context: Record<string, any>,
  ): boolean {
    if (!conditions || conditions.length === 0) return true;

    const results = conditions.map(cond => {
      const fieldValue = this.getNestedValue(context, cond.field);
      return this.evaluateCondition(fieldValue, cond.operator, cond.value);
    });

    return operator === 'AND' ? results.every(r => r) : results.some(r => r);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private evaluateCondition(fieldValue: any, operator: string, condValue: any): boolean {
    switch (operator) {
      case 'equals': return fieldValue === condValue;
      case 'contains': return String(fieldValue || '').toLowerCase().includes(String(condValue).toLowerCase());
      case 'starts_with': return String(fieldValue || '').toLowerCase().startsWith(String(condValue).toLowerCase());
      case 'ends_with': return String(fieldValue || '').toLowerCase().endsWith(String(condValue).toLowerCase());
      case 'is_empty': return !fieldValue || fieldValue === '';
      case 'is_not_empty': return !!fieldValue && fieldValue !== '';
      case 'greater_than': return Number(fieldValue) > Number(condValue);
      case 'less_than': return Number(fieldValue) < Number(condValue);
      default: return false;
    }
  }
}
