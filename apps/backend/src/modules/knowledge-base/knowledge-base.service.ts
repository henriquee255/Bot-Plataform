import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './article.entity';

@Injectable()
export class KnowledgeBaseService {
  constructor(@InjectRepository(Article) private repo: Repository<Article>) {}

  findAll(companyId: string, category?: string, search?: string): Promise<Article[]> {
    const qb = this.repo.createQueryBuilder('a')
      .where('a.company_id = :companyId', { companyId })
      .orderBy('a.created_at', 'DESC');
    if (category) qb.andWhere('a.category = :category', { category });
    if (search) qb.andWhere('(a.title ILIKE :s OR a.content ILIKE :s)', { s: `%${search}%` });
    return qb.getMany();
  }

  findPublic(companyId: string, slug: string): Promise<Article | null> {
    return this.repo.findOne({ where: { company_id: companyId, slug, published: true } });
  }

  async findOne(id: string, companyId: string): Promise<Article> {
    const article = await this.repo.findOne({ where: { id, company_id: companyId } });
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  async create(companyId: string, data: Partial<Article>): Promise<Article> {
    const slug = data.slug || this.slugify(data.title || '');
    const article = this.repo.create({ ...data, company_id: companyId, slug });
    return this.repo.save(article);
  }

  async update(id: string, companyId: string, data: Partial<Article>): Promise<Article> {
    await this.findOne(id, companyId);
    if (data.title && !data.slug) data.slug = this.slugify(data.title);
    await this.repo.update({ id, company_id: companyId }, data);
    return this.findOne(id, companyId);
  }

  async delete(id: string, companyId: string): Promise<void> {
    await this.findOne(id, companyId);
    await this.repo.delete({ id, company_id: companyId });
  }

  async incrementViews(id: string): Promise<void> {
    await this.repo.increment({ id }, 'views', 1);
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}
