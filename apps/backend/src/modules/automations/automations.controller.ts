import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('automations')
@UseGuards(JwtAuthGuard)
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.automationsService.getStats(user.companyId);
  }

  @Get()
  list(@CurrentUser() user: any) {
    return this.automationsService.list(user.companyId);
  }

  @Get(':id')
  get(@CurrentUser() user: any, @Param('id') id: string) {
    return this.automationsService.get(user.companyId, id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.automationsService.create(user.companyId, body);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.automationsService.update(user.companyId, id, body);
  }

  @Post(':id/toggle')
  toggle(@CurrentUser() user: any, @Param('id') id: string) {
    return this.automationsService.toggle(user.companyId, id);
  }

  @Delete(':id')
  delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.automationsService.delete(user.companyId, id);
  }

  @Get(':id/logs')
  getLogs(@CurrentUser() user: any, @Param('id') id: string) {
    return this.automationsService.getLogs(user.companyId, id);
  }
}
