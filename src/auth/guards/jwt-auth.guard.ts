/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/**
 * JWT Auth Guard
 *
 * Conceitos NestJS Guards:
 *
 * 1. Guards determinam se uma requisição deve ser processada
 * 2. Executam ANTES dos Interceptors e Pipes
 * 3. Retornam true (prossegue) ou false (bloqueia)
 * 4. Podem lançar exceções (403 Forbidden, 401 Unauthorized)
 *
 * Este guard:
 * - Valida se o JWT é válido
 * - Anexa user ao request
 * - Permite rotas públicas via @Public() decorator
 *
 * Uso:
 * @UseGuards(JwtAuthGuard)
 * - No controller (protege todas as rotas)
 * - Na rota específica (protege apenas aquela rota)
 * - Global (protege toda a aplicação)
 */

import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * canActivate - Determina se a rota pode ser acessada
   *
   * Verifica se a rota está marcada com @Public()
   * Se sim, permite acesso sem autenticação
   * Se não, valida o JWT
   */
  canActivate(context: ExecutionContext) {
    // Verifica se a rota é pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; // Permite acesso sem autenticação
    }

    // Chama o guard padrão do Passport (valida JWT)
    return super.canActivate(context);
  }

  /**
   * handleRequest - Customiza tratamento de erros
   *
   * Chamado após Passport processar o JWT
   * Permite customizar a resposta em caso de erro
   */
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido ou expirado');
    }
    return user;
  }
}
