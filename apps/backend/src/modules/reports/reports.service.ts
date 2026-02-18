import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../conversations/conversation.entity';
import { Message } from '../messages/message.entity';
import { Contact } from '../contacts/contact.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Conversation) private convRepo: Repository<Conversation>,
    @InjectRepository(Message) private msgRepo: Repository<Message>,
    @InjectRepository(Contact) private contactRepo: Repository<Contact>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  private getDateRange(period: string): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();
    switch (period) {
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      case 'today':
      default:
        start.setHours(0, 0, 0, 0);
    }
    return { start, end };
  }

  async getOverview(companyId: string, period: string, agentId?: string) {
    const { start, end } = this.getDateRange(period);

    const duration = end.getTime() - start.getTime();
    const prevEnd = new Date(start);
    const prevStart = new Date(start.getTime() - duration);

    const buildConvQuery = (alias: string) => {
      const qb = this.convRepo
        .createQueryBuilder(alias)
        .where(`${alias}.company_id = :companyId`, { companyId });
      if (agentId) qb.andWhere(`${alias}.assigned_to = :agentId`, { agentId });
      return qb;
    };

    const [
      totalConversations,
      resolvedConversations,
      newContacts,
      totalMessages,
      prevConversations,
      prevResolved,
      prevContacts,
    ] = await Promise.all([
      buildConvQuery('c').andWhere('c.created_at BETWEEN :start AND :end', { start, end }).getCount(),
      buildConvQuery('c').andWhere("c.status = 'resolved'").andWhere('c.updated_at BETWEEN :start AND :end', { start, end }).getCount(),
      this.contactRepo.createQueryBuilder('c').where('c.company_id = :companyId', { companyId }).andWhere('c.created_at BETWEEN :start AND :end', { start, end }).getCount(),
      this.msgRepo.createQueryBuilder('m').where('m.company_id = :companyId', { companyId }).andWhere('m.created_at BETWEEN :start AND :end', { start, end }).getCount(),
      buildConvQuery('c').andWhere('c.created_at BETWEEN :prevStart AND :prevEnd', { prevStart, prevEnd }).getCount(),
      buildConvQuery('c').andWhere("c.status = 'resolved'").andWhere('c.updated_at BETWEEN :prevStart AND :prevEnd', { prevStart, prevEnd }).getCount(),
      this.contactRepo.createQueryBuilder('c').where('c.company_id = :companyId', { companyId }).andWhere('c.created_at BETWEEN :prevStart AND :prevEnd', { prevStart, prevEnd }).getCount(),
    ]);

    const resolutionRate = totalConversations > 0
      ? Math.round((resolvedConversations / totalConversations) * 100)
      : 0;
    const prevResolutionRate = prevConversations > 0
      ? Math.round((prevResolved / prevConversations) * 100)
      : 0;

    const pct = (curr: number, prev: number) =>
      prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

    return {
      totalConversations,
      resolvedConversations,
      newContacts,
      totalMessages,
      resolutionRate,
      trends: {
        conversations: pct(totalConversations, prevConversations),
        resolved: pct(resolvedConversations, prevResolved),
        contacts: pct(newContacts, prevContacts),
        resolutionRate: resolutionRate - prevResolutionRate,
      },
    };
  }

  async getConversationsByDay(companyId: string, period: string, agentId?: string) {
    const { start, end } = this.getDateRange(period);

    const qb = this.convRepo
      .createQueryBuilder('c')
      .select("DATE_TRUNC('day', c.created_at)", 'day')
      .addSelect('COUNT(*)', 'total')
      .addSelect("COUNT(CASE WHEN c.status = 'resolved' THEN 1 END)", 'resolved')
      .where('c.company_id = :companyId', { companyId })
      .andWhere('c.created_at BETWEEN :start AND :end', { start, end });

    if (agentId) qb.andWhere('c.assigned_to = :agentId', { agentId });

    const rows = await qb
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany();

    return rows.map(r => ({
      date: r.day,
      total: parseInt(r.total),
      resolved: parseInt(r.resolved),
    }));
  }

  async getAgentPerformance(companyId: string, period: string, filterAgentId?: string) {
    const { start, end } = this.getDateRange(period);

    const where: any = { company_id: companyId };
    if (filterAgentId) where.id = filterAgentId;

    const agents = await this.userRepo.find({
      where,
      select: ['id', 'full_name', 'email', 'role'],
    });

    const performance = await Promise.all(
      agents.map(async (agent) => {
        const [handled, resolved, messages] = await Promise.all([
          this.convRepo
            .createQueryBuilder('c')
            .where('c.company_id = :companyId', { companyId })
            .andWhere('c.assigned_to = :agentId', { agentId: agent.id })
            .andWhere('c.created_at BETWEEN :start AND :end', { start, end })
            .getCount(),

          this.convRepo
            .createQueryBuilder('c')
            .where('c.company_id = :companyId', { companyId })
            .andWhere('c.assigned_to = :agentId', { agentId: agent.id })
            .andWhere("c.status = 'resolved'")
            .andWhere('c.updated_at BETWEEN :start AND :end', { start, end })
            .getCount(),

          this.msgRepo
            .createQueryBuilder('m')
            .where('m.company_id = :companyId', { companyId })
            .andWhere('m.sender_id = :agentId', { agentId: agent.id })
            .andWhere("m.sender_type = 'agent'")
            .andWhere('m.created_at BETWEEN :start AND :end', { start, end })
            .getCount(),
        ]);

        return {
          agentId: agent.id,
          name: agent.full_name,
          email: agent.email,
          role: agent.role,
          handled,
          resolved,
          messages,
          resolutionRate: handled > 0 ? Math.round((resolved / handled) * 100) : 0,
        };
      }),
    );

    return performance.sort((a, b) => b.handled - a.handled);
  }

  async getChannelStats(companyId: string, period: string, agentId?: string) {
    const { start, end } = this.getDateRange(period);

    const qb = this.convRepo
      .createQueryBuilder('c')
      .select('c.channel', 'channel')
      .addSelect('COUNT(*)', 'total')
      .addSelect("COUNT(CASE WHEN c.status = 'resolved' THEN 1 END)", 'resolved')
      .where('c.company_id = :companyId', { companyId })
      .andWhere('c.created_at BETWEEN :start AND :end', { start, end });

    if (agentId) qb.andWhere('c.assigned_to = :agentId', { agentId });

    const rows = await qb
      .groupBy('c.channel')
      .orderBy('total', 'DESC')
      .getRawMany();

    return rows.map(r => ({
      channel: r.channel || 'widget',
      total: parseInt(r.total),
      resolved: parseInt(r.resolved),
      rate: parseInt(r.total) > 0
        ? Math.round((parseInt(r.resolved) / parseInt(r.total)) * 100)
        : 0,
    }));
  }

  async getResponseTime(companyId: string, period: string, agentId?: string) {
    const { start, end } = this.getDateRange(period);

    const qb = this.convRepo
      .createQueryBuilder('c')
      .select("DATE_TRUNC('day', c.created_at)", 'day')
      .addSelect(
        "AVG(EXTRACT(EPOCH FROM (c.updated_at - c.created_at)) / 60)",
        'avg_minutes',
      )
      .where('c.company_id = :companyId', { companyId })
      .andWhere("c.status = 'resolved'")
      .andWhere('c.created_at BETWEEN :start AND :end', { start, end });

    if (agentId) qb.andWhere('c.assigned_to = :agentId', { agentId });

    const rows = await qb
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany();

    return rows.map(r => ({
      date: r.day,
      avgMinutes: Math.round(parseFloat(r.avg_minutes) || 0),
    }));
  }

  async getContactGrowth(companyId: string, period: string) {
    const { start, end } = this.getDateRange(period);

    const rows = await this.contactRepo
      .createQueryBuilder('c')
      .select("DATE_TRUNC('day', c.created_at)", 'day')
      .addSelect('COUNT(*)', 'new_contacts')
      .where('c.company_id = :companyId', { companyId })
      .andWhere('c.created_at BETWEEN :start AND :end', { start, end })
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany();

    return rows.map(r => ({
      date: r.day,
      newContacts: parseInt(r.new_contacts),
    }));
  }

  async getCsatStats(companyId: string, period: string, agentId?: string) {
    const { start, end } = this.getDateRange(period);

    const qb = this.convRepo
      .createQueryBuilder('c')
      .select('c.csat_score', 'score')
      .addSelect('COUNT(*)', 'count')
      .where('c.company_id = :companyId', { companyId })
      .andWhere('c.csat_score IS NOT NULL')
      .andWhere('c.updated_at BETWEEN :start AND :end', { start, end });

    if (agentId) qb.andWhere('c.assigned_to = :agentId', { agentId });

    const rows = await qb
      .groupBy('c.csat_score')
      .orderBy('c.csat_score', 'ASC')
      .getRawMany();

    const total = rows.reduce((s, r) => s + parseInt(r.count), 0);
    const weightedSum = rows.reduce(
      (s, r) => s + parseFloat(r.score) * parseInt(r.count),
      0,
    );
    const avg = total > 0 ? Math.round((weightedSum / total) * 10) / 10 : 0;

    return {
      average: avg,
      total,
      distribution: rows.map(r => ({
        score: parseFloat(r.score),
        count: parseInt(r.count),
        pct: total > 0 ? Math.round((parseInt(r.count) / total) * 100) : 0,
      })),
    };
  }
}
