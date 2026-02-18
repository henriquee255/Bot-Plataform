import { Module } from '@nestjs/common';
import { WidgetController } from './widget.controller';
import { WidgetTestController } from './widget-test.controller';
import { WidgetGateway } from './widget.gateway';
import { CompaniesModule } from '../companies/companies.module';
import { ContactsModule } from '../contacts/contacts.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [CompaniesModule, ContactsModule, ConversationsModule, MessagesModule],
  controllers: [WidgetController, WidgetTestController],
  providers: [WidgetGateway],
})
export class WidgetModule { }
