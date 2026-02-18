import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { CrmPipeline } from './crm-pipeline.entity';
import { CrmActivity } from './crm-activity.entity';
import { CrmTask } from './crm-task.entity';
import { Contact } from '../contacts/contact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CrmPipeline, CrmActivity, CrmTask, Contact])],
  controllers: [CrmController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
