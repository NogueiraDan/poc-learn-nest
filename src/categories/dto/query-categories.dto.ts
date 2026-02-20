/**
 * Query Categories DTO - Filtros para Categorias
 */

import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryCategoriesDto extends PaginationDto {
  /**
   * Busca por texto (nome ou descrição)
   */
  @IsOptional()
  @IsString({ message: 'Search deve ser uma string' })
  search?: string;

  /**
   * Campo para ordenar
   */
  @IsOptional()
  @IsString({ message: 'SortBy deve ser uma string' })
  sortBy?: 'name' | 'createdAt';

  /**
   * Direção da ordenação
   */
  @IsOptional()
  @IsString({ message: 'SortOrder deve ser uma string' })
  sortOrder?: 'asc' | 'desc' = 'asc';
}
