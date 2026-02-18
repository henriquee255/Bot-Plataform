import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Channel, ChannelType } from './channel.entity';
import { Contact } from '../contacts/contact.entity';
import { Conversation } from '../conversations/conversation.entity';
import { Message } from '../messages/message.entity';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel) private channelRepo: Repository<Channel>,
    @InjectRepository(Contact) private contactRepo: Repository<Contact>,
    @InjectRepository(Conversation) private conversationRepo: Repository<Conversation>,
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(companyId: string): Promise<Channel[]> {
    return this.channelRepo.find({
      where: { company_id: companyId },
      order: { created_at: 'ASC' },
    });
  }

  async findOne(id: string, companyId: string): Promise<Channel> {
    const channel = await this.channelRepo.findOne({ where: { id, company_id: companyId } });
    if (!channel) throw new NotFoundException('Canal não encontrado');
    return channel;
  }

  async create(companyId: string, data: Partial<Channel>): Promise<Channel> {
    const channel = this.channelRepo.create({
      ...data,
      company_id: companyId,
      status: 'inactive',
    });
    const saved = await this.channelRepo.save(channel);
    // Gerar webhook URL
    saved.webhook_url = `/api/webhooks/${saved.type}/${saved.id}`;
    return this.channelRepo.save(saved);
  }

  async update(id: string, companyId: string, data: Partial<Channel>): Promise<Channel> {
    const channel = await this.findOne(id, companyId);
    Object.assign(channel, data);
    return this.channelRepo.save(channel);
  }

  async remove(id: string, companyId: string): Promise<void> {
    const channel = await this.findOne(id, companyId);
    await this.channelRepo.remove(channel);
  }

  async testConnection(id: string, companyId: string) {
    const channel = await this.findOne(id, companyId);
    // Retorno simulado - em produção faria ping na API do canal
    return {
      ok: channel.status === 'active',
      channel: channel.name,
      type: channel.type,
      message: channel.status === 'active' ? 'Canal conectado' : 'Canal inativo',
    };
  }

  // ── Processamento de mensagens recebidas ────────────────────────────────

  async handleIncomingWhatsapp(channelId: string, payload: any) {
    const channel = await this.channelRepo.findOne({ where: { id: channelId } });
    if (!channel) return;

    // Formato da Meta WhatsApp Cloud API
    const entry = payload?.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];
    if (!message) return;

    const phone = message.from;
    const text = message.text?.body || '[mídia]';
    const contactName = changes?.value?.contacts?.[0]?.profile?.name || phone;

    await this.processIncoming(channel, phone, contactName, text, 'whatsapp_meta');
  }

  async handleIncomingTelegram(channelId: string, payload: any) {
    const channel = await this.channelRepo.findOne({ where: { id: channelId } });
    if (!channel) return;

    const msg = payload?.message;
    if (!msg) return;

    const telegramId = String(msg.from?.id);
    const name = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || `Telegram ${telegramId}`;
    const text = msg.text || '[mídia]';

    await this.processIncoming(channel, `tg_${telegramId}`, name, text, 'telegram');
  }

  private async processIncoming(
    channel: Channel,
    externalId: string,
    name: string,
    text: string,
    channelType: string,
  ) {
    const companyId = channel.company_id;

    // Encontrar ou criar contato
    let contact = await this.contactRepo.findOne({
      where: { company_id: companyId, phone: externalId },
    });
    if (!contact) {
      contact = this.contactRepo.create({
        company_id: companyId,
        full_name: name,
        phone: externalId,
      });
      contact = await this.contactRepo.save(contact);
    }

    // Encontrar conversa aberta ou criar nova
    let conversation = await this.conversationRepo.findOne({
      where: { company_id: companyId, contact_id: contact.id, status: 'open', channel: channelType as any },
      order: { created_at: 'DESC' },
    });
    if (!conversation) {
      conversation = this.conversationRepo.create({
        company_id: companyId,
        contact_id: contact.id,
        channel: channelType as any,
        status: 'open',
        metadata: { contactName: name, channelId: channel.id },
      });
      conversation = await this.conversationRepo.save(conversation);
      this.eventEmitter.emit('conversation.created', { conversation, companyId });
    }

    // Criar mensagem
    const message = this.messageRepo.create({
      conversation_id: conversation.id,
      company_id: companyId,
      sender_type: 'contact',
      sender_id: contact.id,
      content: text,
      content_type: 'text',
      status: 'delivered',
    });
    const savedMsg = await this.messageRepo.save(message);

    // Atualizar conversa
    await this.conversationRepo.update(conversation.id, {
      last_message_at: new Date(),
      last_message_preview: text.slice(0, 200),
    });

    // Emitir para WebSocket
    this.eventEmitter.emit('message.created', { message: savedMsg, conversation, companyId });
  }
}
