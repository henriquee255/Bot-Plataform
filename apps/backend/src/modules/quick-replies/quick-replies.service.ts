import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuickReply } from './quick-reply.entity';

@Injectable()
export class QuickRepliesService {
  constructor(@InjectRepository(QuickReply) private repo: Repository<QuickReply>) {}

  findAll(
    companyId: string,
    search?: string,
    scope?: string,
    userId?: string,
    sectorIds?: string[],
  ): Promise<QuickReply[]> {
    const qb = this.repo.createQueryBuilder('qr')
      .where('qr.company_id = :companyId', { companyId })
      .orderBy('qr.shortcut', 'ASC');

    if (search) {
      qb.andWhere('(qr.shortcut ILIKE :s OR qr.title ILIKE :s OR qr.content ILIKE :s)', { s: `%${search}%` });
    }

    if (scope === 'global') {
      qb.andWhere('qr.scope = :scope', { scope: 'global' });
    } else if (scope === 'sector') {
      qb.andWhere('qr.scope = :scope', { scope: 'sector' });
    } else if (scope === 'individual') {
      qb.andWhere('qr.scope = :scope AND qr.user_id = :userId', { scope: 'individual', userId });
    } else if (scope === 'all') {
      // Return everything for the company, no extra filter
    } else if (userId) {
      // Default: return global + individual for this user + sectors this user belongs to
      const conditions: string[] = [
        'qr.scope = \'global\'',
        '(qr.scope = \'individual\' AND qr.user_id = :userId)',
      ];
      const params: Record<string, any> = { userId };

      if (sectorIds && sectorIds.length > 0) {
        conditions.push('(qr.scope = \'sector\' AND qr.sector_id IN (:...sectorIds))');
        params.sectorIds = sectorIds;
      }

      qb.andWhere(`(${conditions.join(' OR ')})`, params);
    }

    return qb.getMany();
  }

  async create(companyId: string, data: Partial<QuickReply>): Promise<QuickReply> {
    const qr = this.repo.create({ ...data, company_id: companyId });
    return this.repo.save(qr);
  }

  async update(id: string, companyId: string, data: Partial<QuickReply>): Promise<QuickReply> {
    const existing = await this.repo.findOne({ where: { id, company_id: companyId } });
    if (!existing) throw new NotFoundException();
    await this.repo.update({ id, company_id: companyId }, data);
    return this.repo.findOne({ where: { id } }) as Promise<QuickReply>;
  }

  async delete(id: string, companyId: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { id, company_id: companyId } });
    if (!existing) throw new NotFoundException();
    await this.repo.delete({ id, company_id: companyId });
  }
}
