import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Company } from './company.entity';

@Injectable()
export class CompaniesService {
  constructor(@InjectRepository(Company) private repo: Repository<Company>) {}

  async create(data: { name: string }): Promise<Company> {
    const slug =
      data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') +
      '-' +
      uuidv4().slice(0, 6);
    const company = this.repo.create({ name: data.name, slug });
    return this.repo.save(company);
  }

  async findById(id: string): Promise<Company | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByWidgetKey(widgetKey: string): Promise<Company | null> {
    return this.repo.findOne({ where: { widget_key: widgetKey } });
  }

  async updateSettings(id: string, settings: Record<string, any>): Promise<Company> {
    const company = await this.findById(id);
    if (!company) throw new NotFoundException('Company not found');
    company.settings = { ...company.settings, ...settings };
    return this.repo.save(company);
  }

  async updateWidgetConfig(id: string, config: Record<string, any>): Promise<Company> {
    const company = await this.findById(id);
    if (!company) throw new NotFoundException('Company not found');
    company.widget_config = { ...company.widget_config, ...config };
    return this.repo.save(company);
  }

  async update(id: string, data: Partial<Company>): Promise<Company> {
    const company = await this.findById(id);
    if (!company) throw new NotFoundException('Company not found');
    Object.assign(company, data);
    return this.repo.save(company);
  }
}
