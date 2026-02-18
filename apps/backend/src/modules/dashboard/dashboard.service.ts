import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Conversation } from '../conversations/conversation.entity';
import { Message } from '../messages/message.entity';
import { Contact } from '../contacts/contact.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Conversation) private convRepo: Repository<Conversation>,
    @InjectRepository(Message) private msgRepo: Repository<Message>,
    @InjectRepository(Contact) private contactRepo: Repository<Contact>,
    @InjectRedis() private redis: Redis,
  ) {}

  async getMetrics(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const [
      openToday,
      totalOpen,
      unassigned,
      resolvedToday,
      totalContacts,
      totalMessages,
      noResponseLong,
      onlineAgents,
    ] = await Promise.all([
      this.convRepo
        .createQueryBuilder('c')
        .where('c.company_id = :companyId', { companyId })
        .andWhere("c.status = 'open'")
        .andWhere('c.created_at >= :today', { today })
        .getCount(),

      this.convRepo.count({ where: { company_id: companyId, status: 'open' } }),

      this.convRepo.count({
        where: { company_id: companyId, status: 'open', assigned_to: IsNull() },
      }),

      this.convRepo
        .createQueryBuilder('c')
        .where('c.company_id = :companyId', { companyId })
        .andWhere("c.status = 'resolved'")
        .andWhere('c.updated_at >= :today', { today })
        .getCount(),

      this.contactRepo.count({ where: { company_id: companyId } }),

      this.msgRepo
        .createQueryBuilder('m')
        .where('m.company_id = :companyId', { companyId })
        .andWhere('m.created_at >= :today', { today })
        .getCount(),

      this.convRepo
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.contact', 'contact')
        .where('c.company_id = :companyId', { companyId })
        .andWhere("c.status = 'open'")
        .andWhere('c.last_message_at < :thirtyAgo', { thirtyAgo: thirtyMinutesAgo })
        .andWhere('c.is_read = false')
        .orderBy('c.last_message_at', 'ASC')
        .limit(10)
        .getMany(),

      this.getOnlineAgentsCount(),
    ]);

    return {
      openToday,
      totalOpen,
      unassigned,
      resolvedToday,
      totalContacts,
      totalMessages,
      noResponseLong,
      onlineAgents,
    };
  }

  private async getOnlineAgentsCount(): Promise<number> {
    try {
      const keys = await this.redis.keys('agent:online:*');
      return keys.length;
    } catch {
      return 0;
    }
  }
}
