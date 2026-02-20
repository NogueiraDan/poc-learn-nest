/**
 * Roles Decorator
 *
 * Define quais roles têm acesso a uma rota
 *
 * Uso:
 * @Roles(UserRole.ADMIN)
 * @Delete(':id')
 * delete() { ... }
 *
 * @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
 * @Post()
 * create() { ... }
 *
 * Múltiplas roles = acesso permitido se user tiver QUALQUER uma delas (OR)
 * Se precisar de todas (AND), crie um decorator diferente
 */

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
