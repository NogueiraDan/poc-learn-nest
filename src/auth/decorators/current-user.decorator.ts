/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * Current User Decorator
 *
 * Extrai o usuário autenticado do request
 *
 * Conceitos:
 * - createParamDecorator - Cria decorator de parâmetro
 * - ExecutionContext - Acessa o contexto da requisição
 * - request.user - Anexado pelo JwtAuthGuard/JwtStrategy
 *
 * Uso:
 * @Get('me')
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 *
 * @Post()
 * create(@CurrentUser('id') userId: number, @Body() dto: any) {
 *   // Acessa apenas user.id
 * }
 *
 * Vantagens:
 * - Código mais limpo e expressivo
 * - Type-safe (com tipagem correta)
 * - Evita acessar request.user manualmente
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Se data foi passado, retorna propriedade específica
    // Exemplo: @CurrentUser('id') retorna user.id
    return data ? user?.[data] : user;
  },
);
