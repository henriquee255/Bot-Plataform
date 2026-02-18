import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, HttpCode, Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChannelsService } from './channels.service';

@Controller('channels')
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(private channelsService: ChannelsService) {}

  @Get()
  list(@Request() req: any) {
    return this.channelsService.findAll(req.user.companyId);
  }

  @Post()
  create(@Request() req: any, @Body() body: any) {
    return this.channelsService.create(req.user.companyId, body);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @Request() req: any) {
    return this.channelsService.findOne(id, req.user.companyId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.channelsService.update(id, req.user.companyId, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.channelsService.remove(id, req.user.companyId);
  }

  @Post(':id/test')
  test(@Param('id') id: string, @Request() req: any) {
    return this.channelsService.testConnection(id, req.user.companyId);
  }
}
