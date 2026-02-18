import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './plan.entity';
import { PlansService } from './plans.service';
import { PlansPublicController, PlansAdminController } from './plans.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Plan])],
  providers: [PlansService],
  controllers: [PlansPublicController, PlansAdminController],
  exports: [PlansService],
})
export class PlansModule {}
