/* eslint-disable @typescript-eslint/no-unsafe-call */
/**
 * DTO para atualização de livros
 *
 * Conceitos NestJS:
 * - PartialType torna todas as propriedades opcionais
 * - Isso é útil para PATCH requests onde nem todos os campos são obrigatórios
 * - Reutilizamos o CreateBookDto como base (DRY - Don't Repeat Yourself)
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateBookDto } from './create-book.dto';

export class UpdateBookDto extends PartialType(CreateBookDto) {}
