/**
 * Paginated Response DTO - Resposta com metadados de paginação
 *
 * Conceitos:
 * - Retorna não apenas os dados, mas também informações sobre paginação
 * - Facilita navegação no frontend (prev/next page, total de páginas)
 * - Padrão usado por APIs REST populares
 *
 * Exemplo de resposta:
 * {
 *   "data": [...],
 *   "meta": {
 *     "total": 100,
 *     "page": 2,
 *     "limit": 10,
 *     "totalPages": 10,
 *     "hasNextPage": true,
 *     "hasPrevPage": true
 *   }
 * }
 */

export interface PaginationMeta {
  total: number; // Total de registros no banco
  page: number; // Página atual
  limit: number; // Registros por página
  totalPages: number; // Total de páginas
  hasNextPage: boolean; // Existe próxima página?
  hasPrevPage: boolean; // Existe página anterior?
}

export class PaginatedResponseDto<T> {
  data: T[];
  meta: PaginationMeta;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.meta = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }
}
