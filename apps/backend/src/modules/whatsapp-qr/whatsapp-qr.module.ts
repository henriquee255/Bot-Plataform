import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from '../channels/channel.entity';
import { Contact } from '../contacts/contact.entity';
import { Conversation } from '../conversations/conversation.entity';
import { Message } from '../messages/message.entity';
import { ContactsModule } from '../contacts/contacts.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { MessagesModule } from '../messages/messages.module';
import { WhatsAppQrService } from './whatsapp-qr.service';
import { WhatsAppQrController } from './whatsapp-qr.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Channel, Contact, Conversation, Message]),
    ContactsModule,
    ConversationsModule,
    MessagesModule,
  ],
  providers: [WhatsAppQrService],
  controllers: [WhatsAppQrController],
  exports: [WhatsAppQrService],
})
export class WhatsAppQrModule {}
