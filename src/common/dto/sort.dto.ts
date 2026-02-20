/**
 * Sort Order DTO - Query Parameters para Ordenação
 *
 * Conceitos:
 * - ASC: Ascendente (A-Z, 0-9, menor para maior)
 * - DESC: Descendente (Z-A, 9-0, maior para menor)
 *
 * Exemplo de uso:
 * GET /books?sortBy=title&sortOrder=ASC
 * GET /books?sortBy=publicationYear&sortOrder=DESC
 */

import { IsOptional, IsEnum, IsString } from 'class-validator';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class SortDto {
  /**
   * Campo para ordenar
   * Cada controller deve validar se o campo é válido
   */
  @IsOptional()
  @IsString({ message: 'SortBy deve ser uma string' })
  sortBy?: string;

  /**
   * Direção da ordenação
   */
  @IsOptional()
  @IsEnum(SortOrder, { message: 'SortOrder deve ser "asc" ou "desc"' })
  sortOrder?: SortOrder = SortOrder.ASC;

  /**
   * Retorna objeto de ordenação para Prisma
   */
  getOrderBy(defaultField: string = 'id'): Record<string, SortOrder> {
    const field = this.sortBy || defaultField;
    return { [field]: this.sortOrder || SortOrder.ASC };
  }
}
