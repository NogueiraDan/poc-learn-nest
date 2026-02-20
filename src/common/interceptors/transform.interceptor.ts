/**
 * Transform Interceptor
 *
 * Padroniza o formato das respostas da API
 * Envolve os dados em um objeto consistente com:
 * - success: boolean
 * - data: os dados retornados
 * - timestamp: data/hora da resposta
 *
 * Exemplo de resposta:
 * {
 *   "success": true,
 *   "data": { ... },
 *   "timestamp": "2024-01-01T12:00:00.000Z"
 * }
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
