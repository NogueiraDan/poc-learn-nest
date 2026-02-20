/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/**
 * JWT Strategy
 *
 * Conceitos Passport + NestJS:
 *
 * 1. Strategy - Define como autenticar (JWT, Local, OAuth, etc.)
 * 2. ExtractJwt - Extrai token do header Authorization
 * 3. validate() - Método chamado automaticamente se token for válido
 *
 * Fluxo:
 * 1. Cliente envia: Authorization: Bearer <token>
 * 2. Passport extrai e valida o token
 * 3. Se válido, chama validate() com o payload decodificado
 * 4. O retorno de validate() é anexado ao request.user
 * 5. Controllers acessam via @CurrentUser() decorator
 *
 * Por que usar Passport?
 * - Abstração robusta e testada
 * - Suporta múltiplas estratégias
 * - Integração perfeita com NestJS
 * - Comunidade grande e ativa
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      // Extrai JWT do header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Se true, Passport não valida expiração (não recomendado)
      ignoreExpiration: false,

      // Secret usado para assinar/verificar o token
      // Em produção: use variável de ambiente
      secretOrKey: process.env.JWT_SECRET || 'seu-secret-super-seguro',
    });
  }

  /**
   * Validate - Chamado automaticamente após JWT ser verificado
   *
   * O payload contém as informações que foram colocadas no token:
   * - sub: userId
   * - email: email do usuário
   * - role: papel do usuário
   * - iat: issued at (timestamp de criação)
   * - exp: expiration (timestamp de expiração)
   *
   * O retorno deste método é anexado a request.user
   */
  async validate(payload: any) {
    // Valida se usuário ainda existe no banco
    // Importante: se usuário foi deletado, token não deve ser válido
    const user = await this.authService.validateUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Este objeto será anexado a request.user
    return user;
  }
}
