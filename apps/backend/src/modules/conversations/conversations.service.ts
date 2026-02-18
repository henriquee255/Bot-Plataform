import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, LessThan, IsNull } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Conversation } from './conversation.entity';

export type ConversationFilter = 'all' | 'unread' | 'unassigned' | 'mine' | 'resolved';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation) private repo: Repository<Conversation>,
    private eventEmitter: EventEmitter2,
  ) { }

  async findAll(
    companyId: string,
    filter: ConversationFilter,
    userId: string,
    before?: string,
    limit = 30,
  ): Promise<Conversation[]> {
    const qb = this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.contact', 'contact')
      .leftJoinAndSelect('c.session', 'session')
      .leftJoinAndSelect('c.agent', 'agent')
      .where('c.company_id = :companyId', { companyId });

    switch (filter) {
      case 'unread':
        qb.andWhere('c.is_read = false').andWhere("c.status = 'open'");
        break;
      case 'unassigned':
        qb.andWhere('c.assigned_to IS NULL').andWhere("c.status = 'open'");
        break;
      case 'mine':
        qb.andWhere('c.assigned_to = :userId', { userId }).andWhere("c.status = 'open'");
        break;
      case 'resolved':
        qb.andWhere("c.status = 'resolved'");
        break;
      default:
        // 'all' mostra abertas e resolvidas
        qb.andWhere("c.status IN ('open', 'resolved')");
    }

    if (before) {
      qb.andWhere('c.last_message_at < :before', { before: new Date(before) });
    }

    return qb.orderBy('c.last_message_at', 'DESC').take(limit).getMany();
  }

  async findOne(companyId: string, id: string): Promise<Conversation> {
    const conv = await this.repo.findOne({
      where: { id, company_id: companyId },
      relations: ['contact', 'session'],
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  async create(data: Partial<Conversation>): Promise<Conversation> {
    const conv = this.repo.create(data);
    return this.repo.save(conv);
  }

  async getOrCreateForSession(
    sessionId: string,
    contactId: string,
    companyId: string,
  ): Promise<Conversation> {
    const existing = await this.repo.findOne({
      where: { session_id: sessionId, status: 'open' },
    });
    if (existing) return existing;
    return this.create({
      company_id: companyId,
      contact_id: contactId,
      session_id: sessionId,
    });
  }

  async assign(companyId: string, id: string, agentId: string): Promise<Conversation> {
    await this.repo.update({ id, company_id: companyId }, { assigned_to: agentId });
    const conv = await this.findOne(companyId, id);
    this.eventEmitter.emit('conversation.assigned', { conversation: conv, agentId });
    return conv;
  }

  async updateStatus(companyId: string, id: string, status: string): Promise<Conversation> {
    const updateData: any = { status };
    if (status === 'resolved') {
      updateData.assigned_to = null;
    }
    await this.repo.update({ id, company_id: companyId }, updateData);
    const conv = await this.findOne(companyId, id);
    this.eventEmitter.emit('conversation.status_updated', { conversation: conv, status });
    return conv;
  }

  async update(companyId: string, id: string, data: Partial<Conversation>): Promise<Conversation> {
    await this.repo.update({ id, company_id: companyId }, data);
    return this.findOne(companyId, id);
  }

  async markRead(companyId: string, id: string): Promise<void> {
    await this.repo.update({ id, company_id: companyId }, { is_read: true, unread_count: 0 });
  }

  async updateLastMessage(id: string, preview: string, fromContact = false): Promise<void> {
    const update: Partial<Conversation> = {
      last_message_at: new Date(),
      last_message_preview: preview.slice(0, 500),
    };
    if (fromContact) {
      update.is_read = false;
    }
    await this.repo.update(id, update);
    if (fromContact) {
      await this.repo.increment({ id }, 'unread_count', 1);
    }
  }

  async getMetrics(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [openToday, totalOpen, unassigned] = await Promise.all([
      this.repo.count({
        where: { company_id: companyId, status: 'open' },
      }),
      this.repo
        .createQueryBuilder('c')
        .where('c.company_id = :companyId', { companyId })
        .andWhere("c.status = 'open'")
        .andWhere('c.created_at >= :today', { today })
        .getCount(),
      this.repo.count({
        where: { company_id: companyId, status: 'open', assigned_to: IsNull() },
      }),
    ]);

    return { openToday, totalOpen, unassigned };
  }
}
