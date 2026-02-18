import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WhatsAppQrService } from './whatsapp-qr.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../channels/channel.entity';

@Controller('whatsapp-qr')
@UseGuards(JwtAuthGuard)
export class WhatsAppQrController {
  constructor(
    private whatsappQrService: WhatsAppQrService,
    @InjectRepository(Channel) private channelRepo: Repository<Channel>,
  ) {}

  /** Status de todas as sessões WhatsApp QR da empresa */
  @Get('sessions')
  getSessions(@CurrentUser() user: any) {
    return {
      sessions: this.whatsappQrService.getAllSessions(user.companyId),
    };
  }

  /** Status de um canal específico */
  @Get(':channelId/status')
  getStatus(
    @CurrentUser() user: any,
    @Param('channelId') channelId: string,
  ) {
    const session = this.whatsappQrService.getSession(channelId);
    if (!session || session.companyId !== user.companyId) {
      return {
        channelId,
        status: 'disconnected',
        qr: null,
      };
    }
    return session;
  }

  /** Iniciar conexão / gerar QR Code */
  @Post(':channelId/connect')
  async connect(
    @CurrentUser() user: any,
    @Param('channelId') channelId: string,
  ) {
    const channel = await this.channelRepo.findOne({
      where: { id: channelId, company_id: user.companyId },
    });
    if (!channel) throw new NotFoundException('Canal não encontrado');

    // Não aguarda a conexão — ela é assíncrona e atualiza via eventos
    this.whatsappQrService.connect(channelId, user.companyId).catch(() => {});

    return { message: 'Conexão iniciada. Aguarde o QR Code.', channelId };
  }

  /** Desconectar / logout */
  @Delete(':channelId/disconnect')
  async disconnect(
    @CurrentUser() user: any,
    @Param('channelId') channelId: string,
  ) {
    await this.whatsappQrService.disconnect(channelId);
    return { message: 'WhatsApp desconectado com sucesso' };
  }
}
