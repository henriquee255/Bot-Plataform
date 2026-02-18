import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './contact.entity';

@Injectable()
export class ContactsService {
  constructor(@InjectRepository(Contact) private repo: Repository<Contact>) {}

  async findOrCreate(
    companyId: string,
    data: { email?: string; fullName?: string; phone?: string; metadata?: Record<string, any> },
  ): Promise<Contact> {
    if (data.email) {
      const existing = await this.repo.findOne({
        where: { company_id: companyId, email: data.email },
      });
      if (existing) {
        const updates: Partial<Contact> = { last_seen_at: new Date() };
        if (data.fullName && !existing.full_name) updates.full_name = data.fullName;
        if (data.phone && !existing.phone) updates.phone = data.phone;
        if (data.metadata) updates.metadata = { ...existing.metadata, ...data.metadata };
        await this.repo.update(existing.id, updates);
        return { ...existing, ...updates };
      }
    } else if (data.phone) {
      const existing = await this.repo.findOne({
        where: { company_id: companyId, phone: data.phone },
      });
      if (existing) {
        const updates: Partial<Contact> = { last_seen_at: new Date() };
        if (data.fullName && !existing.full_name) updates.full_name = data.fullName;
        if (data.metadata) updates.metadata = { ...existing.metadata, ...data.metadata };
        await this.repo.update(existing.id, updates);
        return { ...existing, ...updates };
      }
    }
    const contact = this.repo.create({
      company_id: companyId,
      email: data.email,
      full_name: data.fullName,
      phone: data.phone,
      metadata: data.metadata || {},
    });
    return this.repo.save(contact);
  }

  async findById(id: string): Promise<Contact | null> {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, companyId: string, data: Partial<Contact>): Promise<Contact | null> {
    await this.repo.update({ id, company_id: companyId }, data);
    return this.findById(id);
  }

  async search(companyId: string, query: string): Promise<Contact[]> {
    return this.repo
      .createQueryBuilder('c')
      .where('c.company_id = :companyId', { companyId })
      .andWhere(
        '(c.full_name ILIKE :q OR c.email ILIKE :q OR c.phone ILIKE :q)',
        { q: `%${query}%` },
      )
      .limit(20)
      .getMany();
  }
}
