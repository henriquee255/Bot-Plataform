import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmPipeline, CrmStage } from './crm-pipeline.entity';
import { CrmActivity } from './crm-activity.entity';
import { CrmTask } from './crm-task.entity';
import { Contact } from '../contacts/contact.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CrmService {
  constructor(
    @InjectRepository(CrmPipeline) private pipelineRepo: Repository<CrmPipeline>,
    @InjectRepository(CrmActivity) private activityRepo: Repository<CrmActivity>,
    @InjectRepository(CrmTask) private taskRepo: Repository<CrmTask>,
    @InjectRepository(Contact) private contactRepo: Repository<Contact>,
  ) {}

  // ── Pipelines ──────────────────────────────────────────────────────

  async getPipelines(companyId: string): Promise<CrmPipeline[]> {
    return this.pipelineRepo.find({
      where: { company_id: companyId, is_active: true },
      order: { created_at: 'ASC' },
    });
  }

  async getOrCreateDefaultPipeline(companyId: string): Promise<CrmPipeline> {
    let pipeline = await this.pipelineRepo.findOne({
      where: { company_id: companyId, is_default: true },
    });

    if (!pipeline) {
      pipeline = this.pipelineRepo.create({
        company_id: companyId,
        name: 'Pipeline de Vendas',
        description: 'Pipeline padrão de gestão de leads',
        is_default: true,
        stages: [
          { id: uuidv4(), name: 'Lead', color: '#6366f1', order: 0, win_probability: 10 },
          { id: uuidv4(), name: 'Qualificado', color: '#8b5cf6', order: 1, win_probability: 25 },
          { id: uuidv4(), name: 'Proposta', color: '#f59e0b', order: 2, win_probability: 50 },
          { id: uuidv4(), name: 'Negociação', color: '#f97316', order: 3, win_probability: 75 },
          { id: uuidv4(), name: 'Ganho', color: '#10b981', order: 4, win_probability: 100 },
          { id: uuidv4(), name: 'Perdido', color: '#ef4444', order: 5, win_probability: 0 },
        ],
      });
      await this.pipelineRepo.save(pipeline);
    }
    return pipeline;
  }

  async createPipeline(companyId: string, data: { name: string; description?: string; stages?: CrmStage[] }): Promise<CrmPipeline> {
    const pipeline = this.pipelineRepo.create({
      company_id: companyId,
      name: data.name,
      description: data.description,
      stages: data.stages || [],
    });
    return this.pipelineRepo.save(pipeline);
  }

  async updatePipeline(companyId: string, pipelineId: string, data: Partial<CrmPipeline>): Promise<CrmPipeline> {
    const pipeline = await this.pipelineRepo.findOne({ where: { id: pipelineId, company_id: companyId } });
    if (!pipeline) throw new NotFoundException('Pipeline não encontrado');
    Object.assign(pipeline, data, { updated_at: new Date() });
    return this.pipelineRepo.save(pipeline);
  }

  // ── Board ─────────────────────────────────────────────────────────

  async getBoard(companyId: string, pipelineId?: string): Promise<Record<string, Contact[]>> {
    const pipeline = pipelineId
      ? await this.pipelineRepo.findOne({ where: { id: pipelineId, company_id: companyId } })
      : await this.getOrCreateDefaultPipeline(companyId);

    if (!pipeline) throw new NotFoundException('Pipeline não encontrado');

    const contacts = await this.contactRepo.find({
      where: { company_id: companyId, crm_pipeline_id: pipeline.id },
      order: { created_at: 'DESC' },
    });

    const board: Record<string, Contact[]> = {};
    for (const stage of pipeline.stages) {
      board[stage.id] = contacts.filter(c => c.crm_stage_id === stage.id);
    }

    return board;
  }

  async moveContact(companyId: string, contactId: string, stageId: string, pipelineId: string, userId: string): Promise<Contact> {
    const contact = await this.contactRepo.findOne({ where: { id: contactId, company_id: companyId } });
    if (!contact) throw new NotFoundException('Contato não encontrado');

    const oldStageId = contact.crm_stage_id;
    contact.crm_stage_id = stageId;
    contact.crm_pipeline_id = pipelineId;
    contact.is_lead = true;
    await this.contactRepo.save(contact);

    await this.activityRepo.save(this.activityRepo.create({
      company_id: companyId,
      contact_id: contactId,
      user_id: userId,
      type: 'stage_change',
      content: 'Movido para nova etapa no pipeline',
      metadata: { from_stage: oldStageId, to_stage: stageId },
    }));

    return contact;
  }

  async updateContactCrm(companyId: string, contactId: string, data: {
    tags?: string[];
    source?: string;
    lead_value?: number;
    is_lead?: boolean;
    notes?: string;
    custom_fields?: Record<string, any>;
    crm_stage_id?: string;
    crm_pipeline_id?: string;
  }, userId: string): Promise<Contact> {
    const contact = await this.contactRepo.findOne({ where: { id: contactId, company_id: companyId } });
    if (!contact) throw new NotFoundException('Contato não encontrado');

    Object.assign(contact, data);
    await this.contactRepo.save(contact);

    return contact;
  }

  // ── Activities ────────────────────────────────────────────────────

  async getActivities(companyId: string, contactId: string, limit = 50): Promise<CrmActivity[]> {
    return this.activityRepo.find({
      where: { company_id: companyId, contact_id: contactId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async addActivity(companyId: string, contactId: string, userId: string, data: {
    type: string;
    content: string;
    metadata?: Record<string, any>;
  }): Promise<CrmActivity> {
    const activity = this.activityRepo.create({
      company_id: companyId,
      contact_id: contactId,
      user_id: userId,
      type: data.type,
      content: data.content,
      metadata: data.metadata || {},
    });
    return this.activityRepo.save(activity);
  }

  // ── Tasks ─────────────────────────────────────────────────────────

  async getTasks(companyId: string, contactId?: string, assignedTo?: string): Promise<CrmTask[]> {
    const where: any = { company_id: companyId };
    if (contactId) where.contact_id = contactId;
    if (assignedTo) where.assigned_to = assignedTo;
    return this.taskRepo.find({ where, order: { due_at: 'ASC', created_at: 'DESC' } });
  }

  async createTask(companyId: string, data: {
    contact_id: string;
    title: string;
    description?: string;
    type?: string;
    priority?: string;
    assigned_to?: string;
    due_at?: string;
  }, userId: string): Promise<CrmTask> {
    const task = this.taskRepo.create({
      company_id: companyId,
      contact_id: data.contact_id,
      assigned_to: data.assigned_to || userId,
      title: data.title,
      description: data.description,
      type: data.type || 'task',
      priority: data.priority || 'normal',
      due_at: data.due_at ? new Date(data.due_at) : undefined,
    });
    const saved = await this.taskRepo.save(task);

    await this.activityRepo.save(this.activityRepo.create({
      company_id: companyId,
      contact_id: data.contact_id,
      user_id: userId,
      type: 'task',
      content: `Tarefa criada: ${data.title}`,
      metadata: { task_id: saved.id },
    }));

    return saved;
  }

  async updateTask(companyId: string, taskId: string, data: Partial<CrmTask>): Promise<CrmTask> {
    const task = await this.taskRepo.findOne({ where: { id: taskId, company_id: companyId } });
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    if (data.status === 'completed' && task.status !== 'completed') {
      (data as any).completed_at = new Date();
    }
    Object.assign(task, data, { updated_at: new Date() });
    return this.taskRepo.save(task);
  }

  async deleteTask(companyId: string, taskId: string): Promise<void> {
    await this.taskRepo.delete({ id: taskId, company_id: companyId });
  }

  async addLead(companyId: string, data: {
    full_name: string;
    email?: string;
    phone?: string;
    source?: string;
    lead_value?: number;
    stage_id?: string;
    pipeline_id?: string;
    tags?: string[];
    notes?: string;
  }): Promise<Contact> {
    const pipeline = data.pipeline_id
      ? await this.pipelineRepo.findOne({ where: { id: data.pipeline_id, company_id: companyId } })
      : await this.getOrCreateDefaultPipeline(companyId);

    if (!pipeline) throw new NotFoundException('Pipeline não encontrado');
    const stage_id = data.stage_id || pipeline.stages[0]?.id;

    const contact = this.contactRepo.create({
      company_id: companyId,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      source: data.source,
      lead_value: data.lead_value || 0,
      is_lead: true,
      crm_pipeline_id: pipeline.id,
      crm_stage_id: stage_id,
      tags: data.tags || [],
      notes: data.notes,
    });
    return this.contactRepo.save(contact);
  }

  async searchLeads(companyId: string, q: string): Promise<Contact[]> {
    if (!q || q.length < 2) return [];
    const qb = this.contactRepo
      .createQueryBuilder('c')
      .where('c.company_id = :companyId', { companyId })
      .andWhere('c.is_lead = true')
      .andWhere(
        '(LOWER(c.full_name) LIKE :q OR LOWER(c.email) LIKE :q OR c.phone LIKE :q)',
        { q: `%${q.toLowerCase()}%` },
      )
      .orderBy('c.created_at', 'DESC')
      .take(20);
    return qb.getMany();
  }

  // ── Stats ─────────────────────────────────────────────────────────

  async getStats(companyId: string): Promise<any> {
    const pipeline = await this.getOrCreateDefaultPipeline(companyId);
    const contacts = await this.contactRepo.find({ where: { company_id: companyId, crm_pipeline_id: pipeline.id } });

    const totalLeads = contacts.length;
    const totalValue = contacts.reduce((sum, c) => sum + Number(c.lead_value || 0), 0);

    const byStage: Record<string, { count: number; value: number }> = {};
    for (const stage of pipeline.stages) {
      const stageContacts = contacts.filter(c => c.crm_stage_id === stage.id);
      byStage[stage.id] = {
        count: stageContacts.length,
        value: stageContacts.reduce((sum, c) => sum + Number(c.lead_value || 0), 0),
      };
    }

    const wonStage = pipeline.stages.find(s => s.win_probability === 100);
    const lostStage = pipeline.stages.find(s => s.win_probability === 0 && s.order > 0);
    const wonDeals = wonStage ? (byStage[wonStage.id]?.count || 0) : 0;
    const lostDeals = lostStage ? (byStage[lostStage.id]?.count || 0) : 0;
    const conversionRate = totalLeads > 0 ? (wonDeals / totalLeads) * 100 : 0;

    return { totalLeads, totalValue, wonDeals, lostDeals, conversionRate, byStage, pipeline };
  }
}
