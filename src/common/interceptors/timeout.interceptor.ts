/**
 * Timeout Interceptor
 *
 * Cancela requisições que demoram mais que o tempo limite
 * Previne que requisições travadas consumam recursos
 *
 * Tempo padrão: 30 segundos
 * Pode ser customizado ou desabilitado por rota usando @SetMetadata
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly timeout = 30000; // 30 seconds

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(this.timeout),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(
            () =>
              new RequestTimeoutException(
                'A requisição demorou muito tempo e foi cancelada',
              ),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
