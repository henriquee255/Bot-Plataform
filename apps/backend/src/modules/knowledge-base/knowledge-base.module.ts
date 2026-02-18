import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './article.entity';
import { KnowledgeBaseService } from './knowledge-base.service';
import { KnowledgeBaseController, KbPublicController } from './knowledge-base.controller';
import { CompaniesModule } from '../companies/companies.module';

@Module({
  imports: [TypeOrmModule.forFeature([Article]), CompaniesModule],
  providers: [KnowledgeBaseService],
  controllers: [KnowledgeBaseController, KbPublicController],
  exports: [KnowledgeBaseService],
})
export class KnowledgeBaseModule {}
