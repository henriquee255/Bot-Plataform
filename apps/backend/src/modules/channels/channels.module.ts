import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './channel.entity';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { ChannelWebhookController } from './channel-webhook.controller';
import { Contact } from '../contacts/contact.entity';
import { Conversation } from '../conversations/conversation.entity';
import { Message } from '../messages/message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Channel, Contact, Conversation, Message])],
  providers: [ChannelsService],
  controllers: [ChannelsController, ChannelWebhookController],
  exports: [ChannelsService],
})
export class ChannelsModule {}
