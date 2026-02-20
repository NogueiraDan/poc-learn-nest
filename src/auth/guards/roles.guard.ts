/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * Roles Guard
 *
 * Conceitos de Autorização:
 *
 * Autenticação vs Autorização:
 * - Autenticação: Quem você é? (JwtAuthGuard)
 * - Autorização: O que você pode fazer? (RolesGuard)
 *
 * Este guard:
 * 1. Executa APÓS JwtAuthGuard (quando user já está autenticado)
 * 2. Verifica se o usuário tem a role necessária
 * 3. Usa metadata definida pelo decorator @Roles()
 *
 * Exemplo de uso:
 * @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
 * @Get('admin-only')
 * adminRoute() { ... }
 *
 * Ordem de execução:
 * 1. JwtAuthGuard valida token
 * 2. RolesGuard verifica role
 * 3. Route handler executa
 */

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * canActivate - Verifica se usuário tem permissão
   *
   * 1. Extrai roles requeridas do metadata (@Roles decorator)
   * 2. Se não há roles definidas, permite acesso
   * 3. Verifica se user.role está nas roles permitidas
   */
  canActivate(context: ExecutionContext): boolean {
    // Busca roles definidas pelo @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se não há roles definidas, permite acesso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Extrai user do request (anexado pelo JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // Verifica se user tem uma das roles permitidas
    return requiredRoles.includes(user.role);
  }
}
