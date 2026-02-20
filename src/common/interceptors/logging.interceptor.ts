/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * Logging Interceptor
 *
 * Intercepta todas as requisições e loga informações importantes:
 * - Método HTTP e URL
 * - Tempo de execução
 * - Status da resposta
 *
 * Interceptors são executados antes e depois do handler do controller
 * Úteis para logging, transformação de dados, cache, etc.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    this.logger.log(
      `Incoming Request: ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`,
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const executionTime = Date.now() - startTime;

          this.logger.log(
            `Outgoing Response: ${method} ${url} - Status: ${statusCode} - Time: ${executionTime}ms`,
          );
        },
        error: (error) => {
          const executionTime = Date.now() - startTime;
          this.logger.error(
            `Request Failed: ${method} ${url} - Error: ${error.message} - Time: ${executionTime}ms`,
          );
        },
      }),
    );
  }
}
