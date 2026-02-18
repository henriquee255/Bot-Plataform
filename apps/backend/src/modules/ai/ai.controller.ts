import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AiService, ChatMessage } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('config')
  getConfig(@CurrentUser() user: any) {
    return this.aiService.getConfig(user.companyId);
  }

  @Post('config')
  saveConfig(@CurrentUser() user: any, @Body() body: any) {
    return this.aiService.saveConfig(user.companyId, body);
  }

  @Post('test')
  testConnection(@CurrentUser() user: any) {
    return this.aiService.testConnection(user.companyId);
  }

  @Post('suggest')
  async suggestReply(
    @CurrentUser() user: any,
    @Body() body: { conversationId: string; messages: ChatMessage[] },
  ) {
    const reply = await this.aiService.suggestReply(
      user.companyId,
      body.conversationId,
      body.messages ?? [],
    );
    return { reply };
  }

  @Post('chat')
  async chat(
    @CurrentUser() user: any,
    @Body() body: { messages: ChatMessage[]; useKB?: boolean },
  ) {
    const reply = await this.aiService.generateResponse(
      user.companyId,
      body.messages,
      body.useKB ?? true,
    );
    return { reply };
  }
}
