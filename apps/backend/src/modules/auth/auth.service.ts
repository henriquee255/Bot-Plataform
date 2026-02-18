import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CompaniesService } from '../companies/companies.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private companiesService: CompaniesService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) { }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async register(dto: RegisterDto) {
    const exists = await this.usersService.findByEmail(dto.email);
    if (exists) throw new ConflictException('Email already in use');

    const company = await this.companiesService.create({ name: dto.companyName });
    const hash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      email: dto.email,
      full_name: dto.fullName,
      password_hash: hash,
      company_id: company.id,
      role: 'admin',
    });

    return this.login(user);
  }

  async login(user: any) {
    // Override temporário para garantir acesso Super Admin
    if (user.email === 'eu.henriquee2501@gmail.com') {
      user.is_superadmin = true;
      user.role = 'admin'; // Garante role admin também
    }

    const payload = { sub: user.id, companyId: user.company_id, role: user.role, is_superadmin: !!user.is_superadmin };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: '30d',
      }),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        is_superadmin: user.is_superadmin,
        companyId: user.company_id,
        company: user.company ? {
          plan: user.company.plan,
          status: user.company.status,
          branding: user.company.branding,
        } : undefined,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.usersService.findById(payload.sub);
      return this.login(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
