import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  getOverview(
    @CurrentUser() user: any,
    @Query('period') period = '30d',
    @Query('agentId') agentId?: string,
  ) {
    return this.reportsService.getOverview(user.companyId, period, agentId);
  }

  @Get('conversations-by-day')
  getConversationsByDay(
    @CurrentUser() user: any,
    @Query('period') period = '30d',
    @Query('agentId') agentId?: string,
  ) {
    return this.reportsService.getConversationsByDay(user.companyId, period, agentId);
  }

  @Get('agent-performance')
  getAgentPerformance(
    @CurrentUser() user: any,
    @Query('period') period = '30d',
    @Query('agentId') agentId?: string,
  ) {
    return this.reportsService.getAgentPerformance(user.companyId, period, agentId);
  }

  @Get('channels')
  getChannelStats(
    @CurrentUser() user: any,
    @Query('period') period = '30d',
    @Query('agentId') agentId?: string,
  ) {
    return this.reportsService.getChannelStats(user.companyId, period, agentId);
  }

  @Get('response-time')
  getResponseTime(
    @CurrentUser() user: any,
    @Query('period') period = '30d',
    @Query('agentId') agentId?: string,
  ) {
    return this.reportsService.getResponseTime(user.companyId, period, agentId);
  }

  @Get('contact-growth')
  getContactGrowth(
    @CurrentUser() user: any,
    @Query('period') period = '30d',
  ) {
    return this.reportsService.getContactGrowth(user.companyId, period);
  }

  @Get('csat')
  getCsatStats(
    @CurrentUser() user: any,
    @Query('period') period = '30d',
    @Query('agentId') agentId?: string,
  ) {
    return this.reportsService.getCsatStats(user.companyId, period, agentId);
  }
}
