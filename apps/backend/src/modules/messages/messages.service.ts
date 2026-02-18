import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Message } from './message.entity';
import { ConversationsService } from '../conversations/conversations.service';

export interface CreateMessageDto {
  conversationId: string;
  companyId: string;
  senderId: string;
  senderType: 'agent' | 'contact' | 'system';
  content?: string;
  contentType?: string;
  attachments?: any[];
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message) private repo: Repository<Message>,
    private conversationsService: ConversationsService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(data: CreateMessageDto): Promise<Message> {
    const msg = this.repo.create({
      conversation_id: data.conversationId,
      company_id: data.companyId,
      sender_id: data.senderId,
      sender_type: data.senderType,
      content: data.content,
      content_type: data.contentType || 'text',
      attachments: data.attachments || [],
    });
    const saved = await this.repo.save(msg);

    const fromContact = data.senderType === 'contact';
    await this.conversationsService.updateLastMessage(
      data.conversationId,
      data.content || '[attachment]',
      fromContact,
    );

    this.eventEmitter.emit('message.created', {
      message: saved,
      conversationId: data.conversationId,
      companyId: data.companyId,
    });

    return saved;
  }

  async findByConversation(
    conversationId: string,
    before?: string,
    limit = 50,
  ): Promise<Message[]> {
    const where: any = { conversation_id: conversationId };
    if (before) where.created_at = LessThan(new Date(before));

    const messages = await this.repo.find({
      where,
      order: { created_at: 'DESC' },
      take: limit,
    });
    return messages.reverse();
  }

  async markAsRead(conversationId: string, upToMessageId: string): Promise<void> {
    const msg = await this.repo.findOne({ where: { id: upToMessageId } });
    if (!msg) return;
    await this.repo
      .createQueryBuilder()
      .update(Message)
      .set({ status: 'read', read_at: new Date() })
      .where(
        "conversation_id = :cid AND created_at <= :date AND sender_type = 'contact'",
        { cid: conversationId, date: msg.created_at },
      )
      .execute();
  }

  async markDelivered(messageId: string): Promise<Message | null> {
    await this.repo.update(messageId, { status: 'delivered', delivered_at: new Date() });
    return this.repo.findOne({ where: { id: messageId } });
  }
}
