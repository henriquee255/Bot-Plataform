import { Controller, Get, Patch, Delete, Put, Param, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('team')
  getTeam(@CurrentUser() user: any) {
    return this.usersService.getTeam(user.companyId);
  }

  @Get()
  listAgents(@CurrentUser() user: any) {
    return this.usersService.findByCompany(user.companyId);
  }

  @Delete(':id')
  deactivate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.deactivate(id, user.companyId);
  }

  @Get('me/schedule')
  getMySchedule(@CurrentUser() user: any) {
    return this.usersService.findById(user.id);
  }

  @Patch('me/schedule')
  updateMySchedule(@CurrentUser() user: any, @Body() body: any) {
    return this.usersService.update(user.id, { work_schedule: body });
  }

  @Get(':id/permissions')
  getPermissions(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.getPermissions(user.companyId, id);
  }

  @Put(':id/permissions')
  setPermissions(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { permissions: { resource: string; actions: string[] }[] },
  ) {
    return this.usersService.setPermissions(user.companyId, id, body.permissions || []);
  }

  @Patch(':id')
  updateUser(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.usersService.updateUserField(id, user.companyId, body, user.role);
  }
}
