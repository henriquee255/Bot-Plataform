import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as os from 'os';
import * as process from 'process';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Company } from '../companies/company.entity';
import { User } from '../users/user.entity';
import { PlatformSetting } from '../settings/platform-setting.entity';
import { Channel } from '../channels/channel.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(PlatformSetting) private settingRepo: Repository<PlatformSetting>,
    @InjectRepository(Channel) private channelRepo: Repository<Channel>,
    private config: ConfigService,
    private jwtService: JwtService,
  ) {}

  // ── Stats ──────────────────────────────────────────────────────────────────

  async getStats() {
    const totalCompanies = await this.companyRepo.count();
    const activeCompanies = await this.companyRepo.count({ where: { status: 'active' } });
    const totalUsers = await this.userRepo.count();
    const activeUsers = await this.userRepo.count({ where: { status: 'active' } });
    const monthlyCompanies = await this.companyRepo.count({ where: { plan: 'monthly', status: 'active' } });
    const annualCompanies = await this.companyRepo.count({ where: { plan: 'annual', status: 'active' } });
    const lifetimeCompanies = await this.companyRepo.count({ where: { plan: 'lifetime', status: 'active' } });
    const freeCompanies = await this.companyRepo.count({ where: { plan: 'free', status: 'active' } });

    const MRR = (monthlyCompanies * 97) + (annualCompanies * 997 / 12);
    const ARR = MRR * 12;
    const churnRate = 2.4;
    const LTV = (MRR / (activeCompanies || 1)) / (churnRate / 100);

    return {
      totalCompanies,
      activeCompanies,
      suspendedCompanies: totalCompanies - activeCompanies,
      totalUsers,
      activeUsers,
      planDistribution: {
        monthly: monthlyCompanies,
        annual: annualCompanies,
        lifetime: lifetimeCompanies,
        free: freeCompanies,
      },
      financials: {
        mrr: Math.round(MRR),
        arr: Math.round(ARR),
        churnRate,
        ltv: Math.round(LTV),
        avgRevenuePerCompany: activeCompanies > 0 ? Math.round(MRR / activeCompanies) : 0,
      },
      growth: {
        users: 15,
        companies: 8,
      },
    };
  }

  async getGrowthStats(days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const newCompanies = await this.companyRepo
      .createQueryBuilder('c')
      .where('c.created_at >= :since', { since })
      .getCount();

    const newUsers = await this.userRepo
      .createQueryBuilder('u')
      .where('u.created_at >= :since', { since })
      .getCount();

    return { days, newCompanies, newUsers, since };
  }

  async getRecentActivity(limit: number) {
    const recentCompanies = await this.companyRepo.find({
      order: { created_at: 'DESC' },
      take: Math.min(limit, 50),
      select: ['id', 'name', 'plan', 'status', 'created_at'],
    });

    const recentUsers = await this.userRepo.find({
      order: { created_at: 'DESC' },
      take: Math.min(limit, 50),
      select: ['id', 'full_name', 'email', 'role', 'status', 'created_at'],
    });

    const activities = [
      ...recentCompanies.map(c => ({
        type: 'company_registered',
        label: `Nova empresa: ${c.name}`,
        meta: { id: c.id, plan: c.plan },
        date: c.created_at,
      })),
      ...recentUsers.map(u => ({
        type: 'user_registered',
        label: `Novo usuário: ${u.full_name}`,
        meta: { id: u.id, role: u.role },
        date: u.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);

    return activities;
  }

  // ── Companies ──────────────────────────────────────────────────────────────

  async listCompanies(filters: { q?: string; status?: string; plan?: string } = {}) {
    const qb = this.companyRepo.createQueryBuilder('c').orderBy('c.created_at', 'DESC');

    if (filters.q) {
      qb.andWhere('(c.name ILIKE :q OR c.slug ILIKE :q)', { q: `%${filters.q}%` });
    }
    if (filters.status) {
      qb.andWhere('c.status = :status', { status: filters.status });
    }
    if (filters.plan) {
      qb.andWhere('c.plan = :plan', { plan: filters.plan });
    }

    const companies = await qb.getMany();
    const result: any[] = [];
    for (const c of companies) {
      const agentCount = await this.userRepo.count({ where: { company_id: c.id, is_active: true } });
      result.push({ ...c, agent_count: agentCount });
    }
    return result;
  }

  async getCompany(id: string) {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Empresa não encontrada');
    const members = await this.userRepo.find({
      where: { company_id: id },
      select: ['id', 'email', 'full_name', 'role', 'is_active', 'status', 'created_at', 'last_seen_at'],
      order: { created_at: 'ASC' },
    });

    // Find owner (role = 'owner' or first admin)
    const owner = members.find(m => (m.role as string) === 'owner') || members.find(m => m.role === 'admin') || members[0] || null;

    // Count WhatsApp channels (active)
    const whatsappCount = await this.channelRepo
      .createQueryBuilder('ch')
      .where('ch.company_id = :id', { id })
      .andWhere("ch.type IN ('whatsapp_meta','whatsapp_baileys','whatsapp_qr')")
      .getCount();

    // Last access = most recent last_seen_at among members
    const lastAccess = members
      .map(m => m.last_seen_at)
      .filter(Boolean)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null;

    return {
      ...company,
      members,
      member_count: members.length,
      owner: owner ? { id: owner.id, full_name: owner.full_name, email: owner.email } : null,
      whatsapp_channels: whatsappCount,
      last_access: lastAccess,
    };
  }

  async createCompany(data: { name: string; email: string; plan?: string; password?: string }) {
    if (!data.name || !data.email) {
      throw new BadRequestException('Nome e e-mail são obrigatórios');
    }

    const slug = data.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const company = this.companyRepo.create({
      name: data.name,
      slug: `${slug}-${Date.now().toString(36)}`,
      plan: (data.plan as any) || 'free',
      status: 'active',
    });
    const savedCompany = await this.companyRepo.save(company);

    const tempPassword = data.password || Math.random().toString(36).slice(-8) + 'A1!';
    const owner = this.userRepo.create({
      email: data.email,
      full_name: 'Administrador',
      role: 'admin',
      status: 'active',
      is_active: true,
      company_id: savedCompany.id,
      password_hash: await bcrypt.hash(tempPassword, 12),
    });
    await this.userRepo.save(owner);

    return { company: savedCompany, tempPassword, ownerEmail: data.email };
  }

  async updateCompany(id: string, data: Partial<Company>) {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Empresa não encontrada');
    Object.assign(company, data);
    return this.companyRepo.save(company);
  }

  async suspendCompany(id: string, reason?: string) {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Empresa não encontrada');
    company.status = 'suspended';
    if (reason) {
      company.settings = {
        ...company.settings,
        suspension_reason: reason,
        suspended_at: new Date().toISOString(),
      };
    }
    return this.companyRepo.save(company);
  }

  async activateCompany(id: string) {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Empresa não encontrada');
    company.status = 'active';
    const settings = { ...company.settings };
    delete settings.suspension_reason;
    delete settings.suspended_at;
    company.settings = settings;
    return this.companyRepo.save(company);
  }

  async deleteCompany(id: string) {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Empresa não encontrada');
    await this.userRepo.delete({ company_id: id });
    await this.companyRepo.remove(company);
  }

  async exportCompaniesCSV(): Promise<string> {
    const companies = await this.companyRepo.find({ order: { created_at: 'DESC' } });
    const header = ['ID', 'Nome', 'Slug', 'Plano', 'Status', 'Max Agentes', 'Criada em'].join(';');
    const rows = companies.map(c =>
      [
        c.id,
        `"${c.name}"`,
        c.slug,
        c.plan,
        c.status,
        c.max_agents,
        new Date(c.created_at).toLocaleDateString('pt-BR'),
      ].join(';'),
    );
    return [header, ...rows].join('\n');
  }

  // ── Users ──────────────────────────────────────────────────────────────────

  async listUsers(search?: string, role?: string, status?: string) {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .leftJoin('u.company', 'c')
      .addSelect(['c.id', 'c.name', 'c.plan'])
      .orderBy('u.created_at', 'DESC');

    if (search) {
      qb.andWhere('(u.email ILIKE :s OR u.full_name ILIKE :s)', { s: `%${search}%` });
    }
    if (role) {
      qb.andWhere('u.role = :role', { role });
    }
    if (status) {
      qb.andWhere('u.status = :status', { status });
    }

    return qb.getMany();
  }

  async createUser(data: {
    full_name: string;
    email: string;
    password: string;
    role?: string;
    company_id?: string;
  }) {
    if (!data.full_name || !data.email || !data.password) {
      throw new BadRequestException('Nome, e-mail e senha são obrigatórios');
    }
    const existing = await this.userRepo.findOne({ where: { email: data.email } });
    if (existing) throw new BadRequestException('E-mail já cadastrado');

    const user = this.userRepo.create({
      full_name: data.full_name,
      email: data.email,
      password_hash: await bcrypt.hash(data.password, 12),
      role: (data.role as any) || 'agent',
      status: 'active',
      is_active: true,
      company_id: data.company_id || undefined,
    } as any);
    const saved = await this.userRepo.save(user);
    const { password_hash, ...result } = saved as any;
    return result;
  }

  async getUser(id: string) {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.company', 'c')
      .where('u.id = :id', { id })
      .getOne();
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async updateUser(
    id: string,
    data: {
      full_name?: string;
      email?: string;
      role?: string;
      status?: string;
      password?: string;
      is_active?: boolean;
    },
  ) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    if (data.full_name !== undefined) user.full_name = data.full_name;
    if (data.email !== undefined) user.email = data.email;
    if (data.role !== undefined) user.role = data.role as any;
    if (data.status !== undefined) user.status = data.status as any;
    if (data.is_active !== undefined) user.is_active = data.is_active;
    if (data.password) {
      user.password_hash = await bcrypt.hash(data.password, 12);
    }

    return this.userRepo.save(user);
  }

  async resendAccess(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
    user.password_hash = await bcrypt.hash(tempPassword, 12);
    await this.userRepo.save(user);
    return { email: user.email, tempPassword };
  }

  async generateImpersonateToken(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    const token = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
        impersonated: true,
      },
      { expiresIn: '1h' },
    );
    return {
      token,
      expiresIn: 3600,
      user: { id: user.id, email: user.email, full_name: user.full_name },
    };
  }

  async deleteUser(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    user.status = 'blocked';
    user.is_active = false;
    await this.userRepo.save(user);
  }

  async exportUsersCSV(): Promise<string> {
    const users = await this.userRepo.find({ order: { created_at: 'DESC' } });
    const header = ['ID', 'Nome', 'E-mail', 'Cargo', 'Status', 'Criado em', 'Último acesso'].join(';');
    const rows = users.map(u =>
      [
        u.id,
        `"${u.full_name}"`,
        u.email,
        u.role,
        u.status,
        new Date(u.created_at).toLocaleDateString('pt-BR'),
        u.last_seen_at ? new Date(u.last_seen_at).toLocaleDateString('pt-BR') : 'Nunca',
      ].join(';'),
    );
    return [header, ...rows].join('\n');
  }

  async toggleSuperadmin(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    user.is_superadmin = !user.is_superadmin;
    if (user.is_superadmin) user.role = 'admin';
    await this.userRepo.save(user);
    return { id: user.id, is_superadmin: user.is_superadmin, full_name: user.full_name };
  }

  // ── Platform Settings ────────────────────────────────────────────────────

  async getPlatformSettings() {
    const settings = await this.settingRepo.find({ order: { group: 'ASC', key: 'ASC' } });
    const result: Record<string, any> = {};
    for (const s of settings) {
      if (!s.is_secret) result[s.key] = s.type === 'boolean' ? s.value === 'true' : s.type === 'number' ? Number(s.value) : s.type === 'json' ? JSON.parse(s.value || '{}') : s.value;
    }
    return result;
  }

  async upsertPlatformSetting(key: string, value: any, opts?: { type?: string; description?: string; group?: string; is_secret?: boolean }) {
    let setting = await this.settingRepo.findOne({ where: { key } });
    if (!setting) {
      setting = this.settingRepo.create({ key, type: opts?.type as any || 'string', description: opts?.description, group: opts?.group, is_secret: opts?.is_secret || false });
    }
    setting.value = typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (opts?.description) setting.description = opts.description;
    if (opts?.group) setting.group = opts.group;
    return this.settingRepo.save(setting);
  }

  async updatePlatformSettings(data: Record<string, any>) {
    const results: any[] = [];
    for (const [key, value] of Object.entries(data)) {
      results.push(await this.upsertPlatformSetting(key, value));
    }
    return { updated: results.length };
  }

  // ── System Health ─────────────────────────────────────────────────────────

  async getSystemHealth() {
    const totalCompanies = await this.companyRepo.count();
    const totalUsers = await this.userRepo.count();
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    const cpuCount = os.cpus().length;
    const freeMemMB = Math.round(os.freemem() / 1024 / 1024);
    const totalMemMB = Math.round(os.totalmem() / 1024 / 1024);

    return {
      status: 'healthy',
      uptime: Math.round(uptime),
      uptimeHuman: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      database: { status: 'connected', totalCompanies, totalUsers },
      memory: {
        used: Math.round(memUsage.rss / 1024 / 1024),
        heap: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        freeSystem: freeMemMB,
        totalSystem: totalMemMB,
        usedPct: Math.round(((totalMemMB - freeMemMB) / totalMemMB) * 100),
      },
      cpu: { cores: cpuCount },
      node: { version: process.version, platform: process.platform },
      timestamp: new Date().toISOString(),
    };
  }

  // ── WhatsApp Plans ───────────────────────────────────────────────────────

  async getWhatsAppPlans() {
    const setting = await this.settingRepo.findOne({ where: { key: 'whatsapp_plans' } });
    if (!setting || !setting.value) {
      return {
        free: { maxNumbers: 0, messagesPerMonth: 0, allowQR: false },
        monthly: { maxNumbers: 1, messagesPerMonth: 1000, allowQR: true },
        annual: { maxNumbers: 3, messagesPerMonth: 5000, allowQR: true },
        lifetime: { maxNumbers: 10, messagesPerMonth: -1, allowQR: true },
      };
    }
    return JSON.parse(setting.value);
  }

  async updateWhatsAppPlans(data: any) {
    await this.upsertPlatformSetting('whatsapp_plans', data, { type: 'json', group: 'whatsapp', description: 'Limites de WhatsApp por plano' });
    return data;
  }
}
