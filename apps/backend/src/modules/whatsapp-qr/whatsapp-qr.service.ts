import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../channels/channel.entity';
import { ContactsService } from '../contacts/contacts.service';
import { ConversationsService } from '../conversations/conversations.service';
import { MessagesService } from '../messages/messages.service';
import * as path from 'path';
import * as fs from 'fs';

export interface WhatsAppSession {
  channelId: string;
  companyId: string;
  status: 'connecting' | 'qr' | 'connected' | 'disconnected' | 'error';
  qr?: string; // base64 QR code image
  phoneNumber?: string;
  connectedAt?: Date;
  error?: string;
}

@Injectable()
export class WhatsAppQrService implements OnModuleDestroy {
  private readonly logger = new Logger(WhatsAppQrService.name);
  private sessions = new Map<string, WhatsAppSession>();
  private clients = new Map<string, any>(); // Baileys clients

  constructor(
    @InjectRepository(Channel) private channelRepo: Repository<Channel>,
    private eventEmitter: EventEmitter2,
    private contactsService: ContactsService,
    private conversationsService: ConversationsService,
    private messagesService: MessagesService,
  ) {}

  getSession(channelId: string): WhatsAppSession | undefined {
    return this.sessions.get(channelId);
  }

  getAllSessions(companyId: string): WhatsAppSession[] {
    return Array.from(this.sessions.values()).filter(s => s.companyId === companyId);
  }

  async connect(channelId: string, companyId: string): Promise<void> {
    if (this.clients.has(channelId)) {
      this.logger.log(`Channel ${channelId} already connecting/connected`);
      return;
    }

    const session: WhatsAppSession = {
      channelId,
      companyId,
      status: 'connecting',
    };
    this.sessions.set(channelId, session);
    this.emitStatus(channelId, session);

    try {
      // Dynamic import do Baileys para evitar erro no startup se não instalado
      const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = await import('@whiskeysockets/baileys');
      const QRCode = await import('qrcode');

      const authDir = path.join(process.cwd(), 'whatsapp-sessions', channelId);
      fs.mkdirSync(authDir, { recursive: true });

      const { state, saveCreds } = await useMultiFileAuthState(authDir);

      const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ['Chat Platform', 'Chrome', '1.0.0'],
        connectTimeoutMs: 30000,
      });

      this.clients.set(channelId, sock);

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', async (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          const qrDataUrl = await QRCode.toDataURL(qr);
          const updated: WhatsAppSession = { ...session, status: 'qr', qr: qrDataUrl };
          this.sessions.set(channelId, updated);
          this.emitStatus(channelId, updated);
          this.logger.log(`QR code gerado para canal ${channelId}`);
        }

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
          this.logger.log(`Conexão fechada para ${channelId}, reconectar: ${shouldReconnect}`);

          this.clients.delete(channelId);

          if (shouldReconnect) {
            setTimeout(() => this.connect(channelId, companyId), 5000);
          } else {
            const disconnected: WhatsAppSession = { ...session, status: 'disconnected', qr: undefined };
            this.sessions.set(channelId, disconnected);
            this.emitStatus(channelId, disconnected);
            // Remove auth files (logged out)
            fs.rmSync(authDir, { recursive: true, force: true });
          }
        }

        if (connection === 'open') {
          const phoneNumber = sock.user?.id?.split(':')[0] || sock.user?.id;
          const connected: WhatsAppSession = {
            ...session,
            status: 'connected',
            qr: undefined,
            phoneNumber,
            connectedAt: new Date(),
          };
          this.sessions.set(channelId, connected);
          this.emitStatus(channelId, connected);

          // Update channel status in DB
          await this.channelRepo
            .createQueryBuilder()
            .update()
            .set({
              status: 'active',
              metadata: () => `'${JSON.stringify({ phoneNumber, connectedAt: new Date().toISOString() })}'::jsonb`,
            })
            .where('id = :id', { id: channelId })
            .execute();

          this.logger.log(`WhatsApp conectado para canal ${channelId}: ${phoneNumber}`);
        }
      });

      sock.ev.on('messages.upsert', async ({ messages }: any) => {
        for (const msg of messages) {
          if (msg.key.fromMe) continue;
          await this.handleIncomingMessage(channelId, companyId, msg);
        }
      });

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Erro ao conectar WhatsApp QR [${channelId}]: ${errorMsg}`);

      if (errorMsg.includes('Cannot find module')) {
        const errSession: WhatsAppSession = {
          ...session,
          status: 'error',
          error: 'Pacote @whiskeysockets/baileys não instalado. Execute: npm install @whiskeysockets/baileys',
        };
        this.sessions.set(channelId, errSession);
        this.emitStatus(channelId, errSession);
      } else {
        const errSession: WhatsAppSession = { ...session, status: 'error', error: errorMsg };
        this.sessions.set(channelId, errSession);
        this.emitStatus(channelId, errSession);
      }
      this.clients.delete(channelId);
    }
  }

  async disconnect(channelId: string): Promise<void> {
    const client = this.clients.get(channelId);
    if (client) {
      try {
        await client.logout();
      } catch { }
      this.clients.delete(channelId);
    }

    const session = this.sessions.get(channelId);
    if (session) {
      const disconnected: WhatsAppSession = { ...session, status: 'disconnected', qr: undefined };
      this.sessions.set(channelId, disconnected);
      this.emitStatus(channelId, disconnected);
    }

    // Remove session files
    const authDir = path.join(process.cwd(), 'whatsapp-sessions', channelId);
    fs.rmSync(authDir, { recursive: true, force: true });

    await this.channelRepo.update(channelId, { status: 'inactive' });
  }

  async sendMessage(channelId: string, to: string, content: string): Promise<void> {
    const client = this.clients.get(channelId);
    if (!client) throw new Error('WhatsApp not connected for channel ' + channelId);

    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    await client.sendMessage(jid, { text: content });
  }

  private async handleIncomingMessage(channelId: string, companyId: string, msg: any): Promise<void> {
    try {
      const from = msg.key.remoteJid?.replace('@s.whatsapp.net', '').replace('@g.us', '');
      if (!from) return;

      const content =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        '[Mídia]';

      const pushName = msg.pushName || from;

      // Find or create contact
      const contact = await this.contactsService.findOrCreate(companyId, {
        phone: from,
        fullName: pushName,
      });

      // Find or create conversation (use phone as session identifier)
      const conversation = await this.conversationsService.getOrCreateForSession(
        `wa-${from}`,
        contact.id,
        companyId,
      );

      // Update conversation channel
      if (conversation.channel !== 'whatsapp_qr') {
        await this.conversationsService.update(companyId, conversation.id, {
          channel: 'whatsapp_qr' as any,
        });
      }

      // Create message
      await this.messagesService.create({
        conversationId: conversation.id,
        companyId,
        senderId: contact.id,
        senderType: 'contact',
        content,
        contentType: 'text',
      });

      this.logger.log(`Mensagem WhatsApp QR recebida de ${from} para empresa ${companyId}`);
    } catch (err) {
      this.logger.error(`Erro ao processar mensagem WhatsApp QR: ${err}`);
    }
  }

  private emitStatus(channelId: string, session: WhatsAppSession): void {
    this.eventEmitter.emit('whatsapp.qr.status', session);
  }

  async onModuleDestroy() {
    for (const [channelId, client] of this.clients) {
      try {
        await client.end();
      } catch { }
    }
    this.clients.clear();
  }
}
