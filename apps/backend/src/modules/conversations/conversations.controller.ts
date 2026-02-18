import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ConversationsService } from './conversations.service';
import type { ConversationFilter } from './conversations.service';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private conversationsService: ConversationsService) { }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('filter') filter = 'all',
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    return this.conversationsService.findAll(
      user.companyId,
      filter as ConversationFilter,
      user.id,
      before,
      limit ? +limit : 30,
    );
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.conversationsService.findOne(user.companyId, id);
  }

  @Post(':id/assign')
  assign(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { agentId: string },
  ) {
    return this.conversationsService.assign(user.companyId, id, body.agentId);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { status?: string, tags?: string[] },
  ) {
    return this.conversationsService.update(user.companyId, id, body);
  }

  @Post(':id/read')
  markRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.conversationsService.markRead(user.companyId, id);
  }

  @Post(':id/resolve')
  resolve(@CurrentUser() user: any, @Param('id') id: string) {
    return this.conversationsService.updateStatus(user.companyId, id, 'resolved');
  }

  @Post(':id/reopen')
  reopen(@CurrentUser() user: any, @Param('id') id: string) {
    return this.conversationsService.updateStatus(user.companyId, id, 'open');
  }

  @Patch(':id/tags')
  updateTags(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { tags: string[] },
  ) {
    return this.conversationsService.update(user.companyId, id, { tags: body.tags });
  }
}
