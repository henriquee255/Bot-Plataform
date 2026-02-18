import { Controller, Get, Patch, Post, Body, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SettingsService } from './settings.service';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  getAll(@Query('secrets') secrets?: string) {
    return this.settingsService.getAllGrouped(secrets === 'true');
  }

  @Get('flat')
  getFlat(@Query('secrets') secrets?: string) {
    return this.settingsService.getAll(secrets === 'true');
  }

  @Patch()
  updateBulk(@Body() body: Record<string, any>) {
    return this.settingsService.bulkUpdate(body).then(() =>
      this.settingsService.getAllGrouped(true),
    );
  }

  @Post('seed')
  seed() {
    return this.settingsService.seedDefaults().then(() =>
      this.settingsService.getAllGrouped(false),
    );
  }
}
