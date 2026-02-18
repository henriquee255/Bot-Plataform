import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BotFlow } from './bot-flow.entity';

@Injectable()
export class BotService {
  constructor(@InjectRepository(BotFlow) private repo: Repository<BotFlow>) {}

  findAll(companyId: string): Promise<BotFlow[]> {
    return this.repo.find({
      where: { company_id: companyId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string, companyId: string): Promise<BotFlow> {
    const flow = await this.repo.findOne({ where: { id, company_id: companyId } });
    if (!flow) throw new NotFoundException('Bot flow not found');
    return flow;
  }

  async findEnabled(companyId: string): Promise<BotFlow[]> {
    return this.repo.find({ where: { company_id: companyId, enabled: true } });
  }

  async create(companyId: string, data: Partial<BotFlow>): Promise<BotFlow> {
    const flow = this.repo.create({ ...data, company_id: companyId });
    return this.repo.save(flow);
  }

  async update(id: string, companyId: string, data: Partial<BotFlow>): Promise<BotFlow> {
    await this.findOne(id, companyId);
    await this.repo.update({ id, company_id: companyId }, data);
    return this.findOne(id, companyId);
  }

  async delete(id: string, companyId: string): Promise<void> {
    await this.findOne(id, companyId);
    await this.repo.delete({ id, company_id: companyId });
  }
}
