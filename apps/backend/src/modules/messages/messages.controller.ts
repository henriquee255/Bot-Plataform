import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MessagesService } from './messages.service';

@Controller('conversations/:conversationId/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get()
  findAll(
    @Param('conversationId') conversationId: string,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagesService.findByConversation(
      conversationId,
      before,
      limit ? +limit : 50,
    );
  }

  @Post()
  create(
    @CurrentUser() user: any,
    @Param('conversationId') conversationId: string,
    @Body() body: { content: string; contentType?: string; attachments?: any[] },
  ) {
    return this.messagesService.create({
      conversationId,
      companyId: user.companyId,
      senderId: user.id,
      senderType: 'agent',
      content: body.content,
      contentType: body.contentType,
      attachments: body.attachments,
    });
  }
}
