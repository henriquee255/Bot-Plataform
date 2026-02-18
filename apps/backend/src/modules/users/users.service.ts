import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { UserPermission } from './user-permission.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    @InjectRepository(UserPermission) private permRepo: Repository<UserPermission>,
  ) { }

  async create(data: Partial<User>): Promise<User> {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id }, relations: ['company'] });
  }

  async findByCompany(companyId: string): Promise<User[]> {
    return this.repo.find({
      where: { company_id: companyId, is_active: true },
      select: ['id', 'email', 'full_name', 'role', 'avatar_url', 'last_seen_at', 'created_at'],
    });
  }

  async updateLastSeen(id: string): Promise<void> {
    await this.repo.update(id, { last_seen_at: new Date() });
  }

  async deactivate(id: string, companyId: string): Promise<void> {
    await this.repo.update({ id, company_id: companyId }, { is_active: false });
  }

  async updateProfile(id: string, data: { full_name?: string; email?: string; currentPassword?: string; newPassword?: string }): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (data.full_name !== undefined) user.full_name = data.full_name;

    if (data.email !== undefined && data.email !== user.email) {
      const existing = await this.repo.findOne({ where: { email: data.email } });
      if (existing) throw new BadRequestException('Email already in use');
      user.email = data.email;
    }

    if (data.newPassword) {
      if (!data.currentPassword) throw new BadRequestException('Current password required');
      const valid = await bcrypt.compare(data.currentPassword, user.password_hash);
      if (!valid) throw new BadRequestException('Invalid current password');
      user.password_hash = await bcrypt.hash(data.newPassword, 12);
    }

    return this.repo.save(user);
  }

  async updateMemberRole(memberId: string, companyId: string, role: 'agent' | 'supervisor' | 'manager' | 'admin'): Promise<User> {
    const user = await this.repo.findOne({ where: { id: memberId, company_id: companyId } });
    if (!user) throw new NotFoundException('Member not found');
    user.role = role;
    return this.repo.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async updateUserField(id: string, companyId: string, data: Partial<User>, requestorRole: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id, company_id: companyId } });
    if (!user) throw new NotFoundException('User not found');

    // Only admin/owner can change role
    if (data.role !== undefined && requestorRole !== 'admin' && requestorRole !== 'owner') {
      throw new BadRequestException('Only admins can change user roles');
    }

    const { role, ...safeData } = data;
    const updateData: Partial<User> = { ...safeData };
    if (data.role !== undefined && (requestorRole === 'admin' || requestorRole === 'owner')) {
      updateData.role = role;
    }

    await this.repo.update({ id, company_id: companyId }, updateData);
    return this.repo.findOne({ where: { id } }) as Promise<User>;
  }

  async getActiveAgents(companyId: string): Promise<User[]> {
    const agents = await this.repo.find({ where: { company_id: companyId, role: In(['agent', 'admin']) } });
    const agentsWithSchedule = agents.filter(a => a.work_schedule?.enabled);
    if (agentsWithSchedule.length === 0) return agents;

    const now = new Date();
    const active = agentsWithSchedule.filter(agent => {
      const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const dayKey = days[now.getDay()];
      const shift = agent.work_schedule!.shifts?.find(s => s.day === dayKey && s.active);
      if (!shift) return false;
      const [sh, sm] = shift.start.split(':').map(Number);
      const [eh, em] = shift.end.split(':').map(Number);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    });
    return active.length > 0 ? active : agents;
  }

  async getPermissions(companyId: string, userId: string): Promise<UserPermission[]> {
    return this.permRepo.find({ where: { company_id: companyId, user_id: userId } });
  }

  async setPermissions(
    companyId: string,
    userId: string,
    permissions: { resource: string; actions: string[] }[],
  ): Promise<UserPermission[]> {
    // Delete all existing permissions for this user in this company
    await this.permRepo.delete({ company_id: companyId, user_id: userId });

    if (permissions.length === 0) return [];

    const entities = permissions.map(p =>
      this.permRepo.create({
        company_id: companyId,
        user_id: userId,
        resource: p.resource,
        actions: p.actions,
      }),
    );

    return this.permRepo.save(entities);
  }

  async getTeam(companyId: string): Promise<User[]> {
    return this.repo.find({
      where: { company_id: companyId, is_active: true },
      select: ['id', 'email', 'full_name', 'role', 'avatar_url', 'last_seen_at', 'created_at'],
    });
  }
}
