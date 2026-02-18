import { Controller, Get, Patch, Delete, Body, Param, UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CompaniesService } from './companies.service';
import { UsersService } from '../users/users.service';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(
    private companiesService: CompaniesService,
    private usersService: UsersService,
  ) { }

  @Get('me')
  getMyCompany(@CurrentUser() user: any) {
    return this.companiesService.findById(user.companyId);
  }

  @Patch('me')
  updateMyCompany(@CurrentUser() user: any, @Body() data: any) {
    if (user.role !== 'owner' && user.role !== 'superadmin') {
      throw new UnauthorizedException('Only owners can update company details');
    }
    return this.companiesService.update(user.companyId, { name: data.name });
  }

  @Patch('me/settings')
  updateSettings(@CurrentUser() user: any, @Body() settings: Record<string, any>) {
    return this.companiesService.updateSettings(user.companyId, settings);
  }

  @Get('me/widget-config')
  getWidgetConfig(@CurrentUser() user: any) {
    return this.companiesService.findById(user.companyId).then(c => ({ widget_config: c?.widget_config || {} }));
  }

  @Patch('me/widget-config')
  updateWidgetConfig(@CurrentUser() user: any, @Body() config: Record<string, any>) {
    return this.companiesService.updateWidgetConfig(user.companyId, config);
  }

  // Members Management
  @Get('me/members')
  getMembers(@CurrentUser() user: any) {
    return this.usersService.findByCompany(user.companyId);
  }

  @Patch('me/members/:id')
  updateMember(@CurrentUser() user: any, @Param('id') memberId: string, @Body() data: any) {
    if (user.role !== 'owner' && user.role !== 'superadmin') {
      throw new UnauthorizedException('Only owners can manage members');
    }
    return this.usersService.updateMemberRole(memberId, user.companyId, data.role);
  }

  @Delete('me/members/:id')
  removeMember(@CurrentUser() user: any, @Param('id') memberId: string) {
    if (user.role !== 'owner' && user.role !== 'superadmin') {
      throw new UnauthorizedException('Only owners can manage members');
    }
    if (user.sub === memberId) {
      throw new UnauthorizedException('You cannot remove yourself');
    }
    return this.usersService.deactivate(memberId, user.companyId);
  }

  @Patch('me/members/:id/schedule')
  updateMemberSchedule(
    @CurrentUser() user: any,
    @Param('id') memberId: string,
    @Body() body: any,
  ) {
    return this.usersService.update(memberId, { work_schedule: body });
  }

  @Get('me/members/available')
  getAvailableMembers(@CurrentUser() user: any) {
    return this.usersService.getActiveAgents(user.companyId);
  }
}
