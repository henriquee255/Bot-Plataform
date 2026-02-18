import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Conversation } from '../conversations/conversation.entity';
import { Message } from '../messages/message.entity';
import { Contact } from '../contacts/contact.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Message, Contact, User])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
