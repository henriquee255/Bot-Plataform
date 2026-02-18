import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('crm')
@UseGuards(JwtAuthGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // ── Pipelines ──────────────────────────────────────────────────────
  @Get('pipelines')
  getPipelines(@CurrentUser() user: any) {
    return this.crmService.getPipelines(user.companyId);
  }

  @Post('pipelines')
  createPipeline(@CurrentUser() user: any, @Body() body: any) {
    return this.crmService.createPipeline(user.companyId, body);
  }

  @Patch('pipelines/:id')
  updatePipeline(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.crmService.updatePipeline(user.companyId, id, body);
  }

  @Post('default-pipeline')
  getOrCreateDefault(@CurrentUser() user: any) {
    return this.crmService.getOrCreateDefaultPipeline(user.companyId);
  }

  // ── Board & Stats ─────────────────────────────────────────────────
  @Get('board')
  getBoard(@CurrentUser() user: any, @Query('pipelineId') pipelineId?: string) {
    return this.crmService.getBoard(user.companyId, pipelineId);
  }

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.crmService.getStats(user.companyId);
  }

  @Post('leads')
  addLead(@CurrentUser() user: any, @Body() body: any) {
    return this.crmService.addLead(user.companyId, body);
  }

  @Get('leads/search')
  searchLeads(@CurrentUser() user: any, @Query('q') q: string) {
    return this.crmService.searchLeads(user.companyId, q || '');
  }

  // ── Contact CRM ───────────────────────────────────────────────────
  @Patch('contacts/:id/move')
  moveContact(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { stageId: string; pipelineId: string },
  ) {
    return this.crmService.moveContact(user.companyId, id, body.stageId, body.pipelineId, user.id);
  }

  @Patch('contacts/:id')
  updateContactCrm(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.crmService.updateContactCrm(user.companyId, id, body, user.id);
  }

  // ── Activities ────────────────────────────────────────────────────
  @Get('contacts/:id/activities')
  getActivities(@CurrentUser() user: any, @Param('id') id: string) {
    return this.crmService.getActivities(user.companyId, id);
  }

  @Post('contacts/:id/activities')
  addActivity(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.crmService.addActivity(user.companyId, id, user.id, body);
  }

  // ── Tasks ─────────────────────────────────────────────────────────
  @Get('tasks')
  getTasks(
    @CurrentUser() user: any,
    @Query('contactId') contactId?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.crmService.getTasks(user.companyId, contactId, assignedTo);
  }

  @Post('tasks')
  createTask(@CurrentUser() user: any, @Body() body: any) {
    return this.crmService.createTask(user.companyId, body, user.id);
  }

  @Patch('tasks/:id')
  updateTask(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.crmService.updateTask(user.companyId, id, body);
  }

  @Delete('tasks/:id')
  deleteTask(@CurrentUser() user: any, @Param('id') id: string) {
    return this.crmService.deleteTask(user.companyId, id);
  }
}
