/**
 * Pagination DTO - Query Parameters para Paginação
 *
 * Conceitos:
 * - Paginação melhora performance (evita carregar todos os registros)
 * - Skip/Take é equivalente a OFFSET/LIMIT no SQL
 * - Page/Limit é mais intuitivo para usuários
 *
 * Exemplo de uso:
 * GET /books?page=2&limit=10
 * GET /books?skip=20&take=10
 */

import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  /**
   * Número da página (começa em 1)
   * Se fornecido, calcula automaticamente o skip
   */
  @ApiPropertyOptional({
    description: 'Número da página (começa em 1)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page deve ser um número inteiro' })
  @Min(1, { message: 'Page deve ser no mínimo 1' })
  page?: number;

  /**
   * Quantidade de registros por página
   * Padrão: 10, Máximo: 100 (para evitar sobrecarga)
   */
  @ApiPropertyOptional({
    description: 'Quantidade de registros por página',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit deve ser um número inteiro' })
  @Min(1, { message: 'Limit deve ser no mínimo 1' })
  @Max(100, { message: 'Limit deve ser no máximo 100' })
  limit?: number = 10;

  /**
   * Quantidade de registros a pular (começando do 0)
   * Alternativa ao page (mais direto)
   */
  @ApiPropertyOptional({
    description: 'Quantidade de registros a pular',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Skip deve ser um número inteiro' })
  @Min(0, { message: 'Skip deve ser no mínimo 0' })
  skip?: number;

  /**
   * Quantidade de registros a retornar
   * Sinônimo de limit (compatibilidade com Prisma)
   */
  @ApiPropertyOptional({
    description: 'Quantidade de registros a retornar',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Take deve ser um número inteiro' })
  @Min(1, { message: 'Take deve ser no mínimo 1' })
  @Max(100, { message: 'Take deve ser no máximo 100' })
  take?: number;

  /**
   * Calcula o skip baseado em page e limit
   */
  getSkip(): number {
    if (this.skip !== undefined) return this.skip;
    if (this.page && this.limit) return (this.page - 1) * this.limit;
    return 0;
  }

  /**
   * Retorna o limit/take efetivo
   */
  getTake(): number {
    return this.take || this.limit || 10;
  }
}
