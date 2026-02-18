import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InvitationsService } from './invitations.service';

@Controller('invitations')
export class InvitationsController {
  constructor(private invitationsService: InvitationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: any,
    @Body() body: { email: string; role?: string },
  ) {
    return this.invitationsService.create(user.companyId, user.id, body.email, body.role);
  }

  @Get(':token')
  getByToken(@Param('token') token: string) {
    return this.invitationsService.findByToken(token);
  }

  @Post(':token/accept')
  accept(
    @Param('token') token: string,
    @Body() body: { fullName: string; password: string },
  ) {
    return this.invitationsService.accept(token, body.fullName, body.password);
  }
}
