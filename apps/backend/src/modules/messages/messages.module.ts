import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { Message } from './message.entity';
import { ConversationsModule } from '../conversations/conversations.module';
import { UsersModule } from '../users/users.module';
import { SystemActivityListener } from './system-activity.listener';

@Module({
  imports: [TypeOrmModule.forFeature([Message]), ConversationsModule, UsersModule],
  providers: [MessagesService, SystemActivityListener],
  controllers: [MessagesController],
  exports: [MessagesService],
})
export class MessagesModule { }
