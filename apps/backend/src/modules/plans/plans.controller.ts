import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlansService } from './plans.service';

/** Rota pública – planos visíveis na landing/registro */
@Controller('plans')
export class PlansPublicController {
  constructor(private plansService: PlansService) {}

  @Get()
  listPublic() {
    return this.plansService.findAll(false);
  }
}

/** Rota protegida – gestão de planos pelo super-admin */
@Controller('admin/plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin')
export class PlansAdminController {
  constructor(private plansService: PlansService) {}

  @Get()
  listAll(@Query('all') all?: string) {
    return this.plansService.findAll(all === 'true');
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.plansService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.plansService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.plansService.remove(id);
  }

  @Post(':id/set-featured')
  setFeatured(@Param('id') id: string) {
    return this.plansService.setFeatured(id);
  }

  @Post('seed-defaults')
  seedDefaults() {
    return this.plansService.seedDefaultPlans();
  }
}
