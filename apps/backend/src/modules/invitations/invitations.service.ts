import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Invitation } from './invitation.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation) private repo: Repository<Invitation>,
    private usersService: UsersService,
  ) { }

  async create(
    companyId: string,
    invitedBy: string,
    email: string,
    role = 'agent',
  ): Promise<Invitation> {
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const inv = this.repo.create({
      company_id: companyId,
      invited_by: invitedBy,
      email,
      role,
      expires_at,
    });
    return this.repo.save(inv);
  }

  async findByToken(token: string): Promise<Invitation | null> {
    return this.repo.findOne({ where: { token } });
  }

  async accept(token: string, fullName: string, password: string) {
    const inv = await this.findByToken(token);
    if (!inv) throw new NotFoundException('Invitation not found');
    if (inv.accepted_at) throw new BadRequestException('Already accepted');
    if (inv.expires_at < new Date()) throw new BadRequestException('Invitation expired');

    const hash = await bcrypt.hash(password, 12);
    const user = await this.usersService.create({
      company_id: inv.company_id,
      email: inv.email,
      full_name: fullName,
      password_hash: hash,
      role: inv.role as 'agent' | 'supervisor' | 'manager' | 'admin',
    });

    await this.repo.update(inv.id, { accepted_at: new Date() });
    return user;
  }
}
