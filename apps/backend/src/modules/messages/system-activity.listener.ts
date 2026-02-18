import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MessagesService } from './messages.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class SystemActivityListener {
    constructor(
        private messagesService: MessagesService,
        private usersService: UsersService,
    ) { }

    @OnEvent('conversation.assigned')
    async handleConversationAssigned(payload: { conversation: any; agentId: string }) {
        const { conversation, agentId } = payload;
        const agent = await this.usersService.findById(agentId);
        if (!agent) return;

        await this.messagesService.create({
            conversationId: conversation.id,
            companyId: conversation.company_id,
            senderId: 'system',
            senderType: 'system',
            content: `${agent.full_name} assumiu o atendimento.`,
        });
    }

    @OnEvent('conversation.status_updated')
    async handleStatusUpdated(payload: { conversation: any; status: string }) {
        const { conversation, status } = payload;
        if (status !== 'resolved') return;

        await this.messagesService.create({
            conversationId: conversation.id,
            companyId: conversation.company_id,
            senderId: 'system',
            senderType: 'system',
            content: 'Atendimento finalizado.',
        });
    }
}
