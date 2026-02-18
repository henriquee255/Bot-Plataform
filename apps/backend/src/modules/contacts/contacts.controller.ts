import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ContactsService } from './contacts.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactNote } from './contact-note.entity';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(
    private contactsService: ContactsService,
    @InjectRepository(ContactNote) private notesRepo: Repository<ContactNote>,
  ) {}

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.contactsService.findById(id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.contactsService.update(id, user.companyId, body);
  }

  @Get()
  search(@CurrentUser() user: any, @Query('q') q: string) {
    return this.contactsService.search(user.companyId, q || '');
  }

  @Post()
  create(
    @CurrentUser() user: any,
    @Body() body: { full_name?: string; email?: string; phone?: string; metadata?: Record<string, any> },
  ) {
    return this.contactsService.findOrCreate(user.companyId, {
      email: body.email,
      fullName: body.full_name,
      phone: body.phone,
      metadata: { ...body.metadata, source: 'manual' },
    });
  }

  // Notes
  @Get(':id/notes')
  getNotes(@CurrentUser() user: any, @Param('id') contactId: string) {
    return this.notesRepo.find({
      where: { contact_id: contactId, company_id: user.companyId },
      order: { created_at: 'DESC' },
    });
  }

  @Post(':id/notes')
  createNote(
    @CurrentUser() user: any,
    @Param('id') contactId: string,
    @Body() body: { content: string },
  ) {
    const note = this.notesRepo.create({
      contact_id: contactId,
      company_id: user.companyId,
      user_id: user.id,
      content: body.content,
    });
    return this.notesRepo.save(note);
  }

  @Delete(':contactId/notes/:noteId')
  deleteNote(
    @CurrentUser() user: any,
    @Param('contactId') contactId: string,
    @Param('noteId') noteId: string,
  ) {
    return this.notesRepo.delete({ id: noteId, contact_id: contactId, company_id: user.companyId });
  }
}
