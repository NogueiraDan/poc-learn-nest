/**
 * Public Decorator
 *
 * Conceitos de Custom Decorators:
 *
 * 1. SetMetadata - Anexa metadata a uma rota/controller
 * 2. Metadata pode ser lida por Guards, Interceptors, etc.
 * 3. Permite criar APIs mais expressivas e legíveis
 *
 * Este decorator:
 * - Marca rotas como públicas (sem autenticação)
 * - Usado pelo JwtAuthGuard para permitir acesso
 *
 * Uso:
 * @Public()
 * @Post('login')
 * login() { ... }
 *
 * Sem este decorator, todas as rotas exigem autenticação
 * quando JwtAuthGuard é aplicado globalmente
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
