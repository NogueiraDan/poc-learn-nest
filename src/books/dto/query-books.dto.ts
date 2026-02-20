/**
 * Query Books DTO - Filtros Avançados para Busca de Livros
 *
 * Conceitos:
 * - Herda de PaginationDto e SortDto para reutilizar código
 * - Permite filtros combinados (search + category + author + year)
 * - Query parameters são opcionais (sem filtros = retorna todos)
 *
 * Exemplos de uso:
 * GET /books?search=clean+code                 // Busca texto
 * GET /books?categoryId=1                      // Filtrar por categoria
 * GET /books?authorId=2                        // Filtrar por autor
 * GET /books?yearFrom=2020&yearTo=2023         // Filtrar por ano
 * GET /books?available=true                    // Apenas disponíveis
 * GET /books?search=design&categoryId=3&page=2&limit=10&sortBy=title&sortOrder=asc
 */

import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryBooksDto extends PaginationDto {
  /**
   * Busca por texto (título, ISBN ou descrição)
   * Usa ILIKE no PostgreSQL (case-insensitive)
   */
  @IsOptional()
  @IsString({ message: 'Search deve ser uma string' })
  search?: string;

  /**
   * Filtrar por categoria (ID)
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'CategoryId deve ser um número inteiro' })
  categoryId?: number;

  /**
   * Filtrar por autor (ID)
   * Busca na tabela intermediária BookAuthor
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'AuthorId deve ser um número inteiro' })
  authorId?: number;

  /**
   * Filtrar por ano - mínimo
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'YearFrom deve ser um número inteiro' })
  @Min(1000, { message: 'YearFrom deve ser no mínimo 1000' })
  @Max(9999, { message: 'YearFrom deve ser no máximo 9999' })
  yearFrom?: number;

  /**
   * Filtrar por ano - máximo
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'YearTo deve ser um número inteiro' })
  @Min(1000, { message: 'YearTo deve ser no mínimo 1000' })
  @Max(9999, { message: 'YearTo deve ser no máximo 9999' })
  yearTo?: number;

  /**
   * Filtrar apenas livros disponíveis (availableCopies > 0)
   */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'Available deve ser um booleano' })
  available?: boolean;

  /**
   * Campo para ordenar
   * Valores válidos: title, isbn, publicationYear, createdAt
   */
  @IsOptional()
  @IsString({ message: 'SortBy deve ser uma string' })
  sortBy?: 'title' | 'isbn' | 'publicationYear' | 'createdAt';

  /**
   * Direção da ordenação (asc ou desc)
   */
  @IsOptional()
  @IsString({ message: 'SortOrder deve ser uma string' })
  sortOrder?: 'asc' | 'desc' = 'asc';
}
