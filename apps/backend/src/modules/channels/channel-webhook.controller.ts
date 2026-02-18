import { Controller, Post, Get, Param, Body, Query, HttpCode, Logger } from '@nestjs/common';
import { ChannelsService } from './channels.service';

@Controller('webhooks')
export class ChannelWebhookController {
  private readonly logger = new Logger(ChannelWebhookController.name);

  constructor(private channelsService: ChannelsService) {}

  /** Verificação do webhook WhatsApp Meta */
  @Get('whatsapp/:channelId')
  verifyWhatsapp(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Param('channelId') channelId: string,
  ) {
    if (mode === 'subscribe') {
      return parseInt(challenge, 10) || challenge;
    }
    return { ok: false };
  }

  /** Receber mensagens WhatsApp — sempre retorna 200 para o Meta não reenviar */
  @Post('whatsapp/:channelId')
  @HttpCode(200)
  async receiveWhatsapp(@Param('channelId') channelId: string, @Body() body: any) {
    try {
      await this.channelsService.handleIncomingWhatsapp(channelId, body);
    } catch (err) {
      this.logger.error(`WhatsApp webhook error [${channelId}]: ${err?.message}`);
    }
    return { ok: true };
  }

  /** Receber mensagens Telegram — sempre retorna 200 */
  @Post('telegram/:channelId')
  @HttpCode(200)
  async receiveTelegram(@Param('channelId') channelId: string, @Body() body: any) {
    try {
      await this.channelsService.handleIncomingTelegram(channelId, body);
    } catch (err) {
      this.logger.error(`Telegram webhook error [${channelId}]: ${err?.message}`);
    }
    return { ok: true };
  }
}
