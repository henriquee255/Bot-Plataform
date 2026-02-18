import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { UsersModule } from '../users/users.module';
import { Conversation } from '../conversations/conversation.entity';
import { Message } from '../messages/message.entity';
import { Contact } from '../contacts/contact.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message, Contact]),
    UsersModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
