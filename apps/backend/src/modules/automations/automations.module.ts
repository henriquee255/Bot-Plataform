import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomationsController } from './automations.controller';
import { AutomationsService } from './automations.service';
import { Automation } from './automation.entity';
import { AutomationLog } from './automation-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Automation, AutomationLog])],
  controllers: [AutomationsController],
  providers: [AutomationsService],
  exports: [AutomationsService],
})
export class AutomationsModule {}
