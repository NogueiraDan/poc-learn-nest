/**
 * Logger Middleware
 *
 * Middleware customizado que loga informações detalhadas de cada requisição:
 * - Request ID único (para rastreamento)
 * - Método HTTP, URL, IP
 * - Headers importantes
 * - Corpo da requisição (se aplicável)
 * - Tempo de execução
 *
 * Diferença entre Middleware e Interceptor:
 * - Middleware: Executado ANTES dos guards/interceptors/pipes
 * - Interceptor: Executado DEPOIS dos guards, ANTES e DEPOIS do handler
 *
 * Middleware é melhor para logging de requisições puras (sem processamento)
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Gerar Request ID único para rastreamento
    const requestId = randomUUID();
    req['requestId'] = requestId; // Anexa ao request para uso posterior

    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || 'Unknown';
    const startTime = Date.now();

    // Log detalhado da requisição
    this.logger.log(`[${requestId}] --> ${method} ${originalUrl}`);
    this.logger.debug(`[${requestId}] IP: ${ip} | User-Agent: ${userAgent}`);

    // Se tiver body (POST/PUT/PATCH), loga (exceto senhas)
    if (req.body && Object.keys(req.body).length > 0) {
      const sanitizedBody = this.sanitizeBody(req.body);
      this.logger.debug(
        `[${requestId}] Body: ${JSON.stringify(sanitizedBody)}`,
      );
    }

    // Intercepta a resposta para logar quando terminar
    res.on('finish', () => {
      const { statusCode } = res;
      const executionTime = Date.now() - startTime;
      const logLevel = statusCode >= 400 ? 'error' : 'log';

      this.logger[logLevel](
        `[${requestId}] <-- ${method} ${originalUrl} ${statusCode} - ${executionTime}ms`,
      );
    });

    next();
  }

  /**
   * Remove informações sensíveis do body antes de logar
   */
  private sanitizeBody(body: any): any {
    const sensitiveFields = [
      'password',
      'token',
      'accessToken',
      'refreshToken',
    ];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
