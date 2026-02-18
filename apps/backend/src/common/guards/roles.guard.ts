import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();

    // Se o usuário for superadmin, ele tem acesso a tudo ou a rotas específicas de superadmin
    if (requiredRoles.includes('superadmin')) {
      return user?.is_superadmin === true;
    }

    // Para outros papéis, verifica se o papel do usuário está na lista
    return requiredRoles.includes(user?.role);
  }
}
