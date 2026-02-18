import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BotService } from './bot.service';

@Controller('bot-flows')
@UseGuards(JwtAuthGuard)
export class BotController {
  constructor(private service: BotService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.companyId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.findOne(id, user.companyId);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.service.create(user.companyId, body);
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
