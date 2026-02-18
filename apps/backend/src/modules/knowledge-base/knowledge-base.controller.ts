import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { KnowledgeBaseService } from './knowledge-base.service';
import { CompaniesService } from '../companies/companies.service';

@Controller('knowledge-base')
@UseGuards(JwtAuthGuard)
export class KnowledgeBaseController {
  constructor(private service: KnowledgeBaseService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('category') category?: string,
    @Query('q') search?: string,
  ) {
    return this.service.findAll(user.companyId, category, search);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.findOne(id, user.companyId);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.service.create(user.companyId, body);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.service.update(id, user.companyId, body);
  }

  @Delete(':id')
  delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.delete(id, user.companyId);
  }
}

@Controller('knowledge-base')
export class KbPublicController {
  constructor(
    private service: KnowledgeBaseService,
    private companiesService: CompaniesService,
  ) {}

  @Public()
  @Get('public')
  async getPublicArticles(
    @Query('widgetKey') widgetKey: string,
    @Query('q') q?: string,
  ) {
    if (!widgetKey) return [];
    const company = await this.companiesService.findByWidgetKey(widgetKey);
    if (!company) return [];
    return this.service.findAll(company.id, undefined, q);
  }

  @Public()
  @Get(':companyId/:slug')
  async getPublic(@Param('companyId') companyId: string, @Param('slug') slug: string) {
    const article = await this.service.findPublic(companyId, slug);
    if (article) await this.service.incrementViews(article.id);
    return article;
  }
}
