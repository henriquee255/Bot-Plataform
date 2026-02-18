import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactsService } from './contacts.service';
import { ContactSessionsService } from './contact-sessions.service';
import { ContactsController } from './contacts.controller';
import { Contact } from './contact.entity';
import { ContactSession } from './contact-session.entity';
import { ContactNote } from './contact-note.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contact, ContactSession, ContactNote])],
  providers: [ContactsService, ContactSessionsService],
  controllers: [ContactsController],
  exports: [ContactsService, ContactSessionsService],
})
export class ContactsModule {}
