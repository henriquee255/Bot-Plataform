import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { QuickRepliesService } from './quick-replies.service';

@Controller('quick-replies')
@UseGuards(JwtAuthGuard)
export class QuickRepliesController {
  constructor(private service: QuickRepliesService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('q') search?: string,
    @Query('scope') scope?: string,
  ) {
    // user.sectorIds may be available if the JWT payload includes it; fall back to empty array
    const sectorIds: string[] = user.sectorIds || [];
    return this.service.findAll(user.companyId, search, scope, user.id || user.sub, sectorIds);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    // Ensure user_id is set when scope is individual
    const data = { ...body };
    if (data.scope === 'individual' && !data.user_id) {
      data.user_id = user.id || user.sub;
    }
    return this.service.create(user.companyId, data);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.service.update(id, user.companyId, body);
  }

  @Delete(':id')
  delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.delete(id, user.companyId);
  }
}
