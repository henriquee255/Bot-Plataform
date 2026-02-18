import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CompaniesService } from '../companies/companies.service';
import { ContactsService } from '../contacts/contacts.service';
import { ContactSessionsService } from '../contacts/contact-sessions.service';
import { ConversationsService } from '../conversations/conversations.service';
import { MessagesService } from '../messages/messages.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('widget')
export class WidgetController {
  constructor(
    private companiesService: CompaniesService,
    private contactsService: ContactsService,
    private contactSessionsService: ContactSessionsService,
    private conversationsService: ConversationsService,
    private messagesService: MessagesService,
  ) { }

  @Public()
  @Get('widget.js')
  getWidgetScript(@Res() res: Response) {
    try {
      const widgetPath = join(__dirname, '../../../../..', 'packages', 'widget', 'dist', 'widget.js');
      const widgetScript = readFileSync(widgetPath, 'utf-8');
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(widgetScript);
    } catch (error) {
      throw new NotFoundException('Widget script not found');
    }
  }

  @Public()
  @Post('session')
  @HttpCode(HttpStatus.OK)
  async initSession(
    @Body()
    body: {
      widgetKey: string;
      sessionToken?: string;
      domain?: string;
      url?: string;
      referrer?: string;
      userAgent?: string;
    },
    @Req() req: Request,
  ) {
    const company = await this.companiesService.findByWidgetKey(body.widgetKey);
    if (!company) throw new NotFoundException('Invalid widget key');

    if (body.sessionToken) {
      const session = await this.contactSessionsService.findByToken(body.sessionToken);
      if (session && session.company_id === company.id) {
        await this.contactSessionsService.updateUrl(session.id, body.url || '');
        return {
          sessionToken: session.session_token,
          contactId: session.contact_id,
          config: company.settings,
        };
      }
    }

    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress;

    const session = await this.contactSessionsService.createSession(company.id, {
      domain: body.domain,
      lastUrl: body.url,
      referrer: body.referrer,
      userAgent: body.userAgent,
      ipAddress,
    });

    return {
      sessionToken: session.session_token,
      contactId: null,
      config: company.settings,
    };
  }

  @Public()
  @Post('identify')
  @HttpCode(HttpStatus.OK)
  async identify(
    @Body() body: {
      sessionToken: string;
      email?: string;
      fullName?: string;
      phone?: string;
      cpf?: string;
      sectorId?: string;
      metadata?: Record<string, any>;
    },
  ) {
    const session = await this.contactSessionsService.findByToken(body.sessionToken);
    if (!session) throw new NotFoundException('Session not found');

    const contact = await this.contactsService.findOrCreate(session.company_id, {
      email: body.email,
      fullName: body.fullName,
      phone: body.phone,
      metadata: {
        cpf: body.cpf,
        ...body.metadata,
      },
    });

    await this.contactSessionsService.linkContact(session.id, contact.id);

    // Se selecionou um setor, criar conversa com setor já atribuído
    if (body.sectorId) {
      const conversation = await this.conversationsService.getOrCreateForSession(
        session.id,
        contact.id,
        session.company_id,
      );
      await this.conversationsService.update(session.company_id, conversation.id, {
        sector_id: body.sectorId,
      });
    }

    return { contactId: contact.id, contact };
  }

  @Public()
  @Get('sectors')
  async getPublicSectors(@Query('widgetKey') widgetKey: string) {
    const company = await this.companiesService.findByWidgetKey(widgetKey);
    if (!company) throw new NotFoundException('Invalid widget key');
    // Retorna apenas setores da empresa para seleção no widget
    return { company_id: company.id, sectors: [] }; // será preenchido quando a SectorsService for injetada
  }

  @Public()
  @Get('conversation')
  async getConversation(@Query('sessionToken') sessionToken: string) {
    const session = await this.contactSessionsService.findByToken(sessionToken);
    if (!session) throw new NotFoundException('Session not found');
    if (!session.contact_id) return { conversation: null };

    const conversation = await this.conversationsService.getOrCreateForSession(
      session.id,
      session.contact_id,
      session.company_id,
    );

    return { conversation };
  }

  @Public()
  @Get('conversations/:conversationId/messages')
  async getMessages(
    @Query('sessionToken') sessionToken: string,
    @Param('conversationId') conversationId: string,
    @Query('before') before?: string,
  ) {
    const session = await this.contactSessionsService.findByToken(sessionToken);
    if (!session) throw new NotFoundException('Session not found');

    return this.messagesService.findByConversation(conversationId, before);
  }

  @Public()
  @Post('conversations/:conversationId/messages')
  async sendMessage(
    @Body() body: { sessionToken: string; content: string; contentType?: string },
    @Param('conversationId') conversationId: string,
  ) {
    const session = await this.contactSessionsService.findByToken(body.sessionToken);
    if (!session || !session.contact_id) throw new NotFoundException('Session not valid');

    return this.messagesService.create({
      conversationId,
      companyId: session.company_id,
      senderId: session.contact_id,
      senderType: 'contact',
      content: body.content,
      contentType: body.contentType || 'text',
    });
  }
}
