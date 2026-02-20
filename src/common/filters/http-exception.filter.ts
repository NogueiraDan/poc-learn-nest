/**
 * HTTP Exception Filter
 *
 * Conceitos NestJS:
 * - Captura todas as exceções HTTP da aplicação
 * - Formata a resposta de erro de forma consistente
 * - Adiciona informações úteis para debugging (timestamp, path)
 *
 * Este filter captura:
 * - NotFoundException (404)
 * - BadRequestException (400)
 * - UnauthorizedException (401)
 * - ForbiddenException (403)
 * - InternalServerErrorException (500)
 * - Qualquer outra HttpException
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Se a resposta for um objeto (geralmente de validação), usamos ela
    // Caso contrário, criamos uma estrutura padrão
    const errorResponse =
      typeof exceptionResponse === 'object'
        ? exceptionResponse
        : { message: exceptionResponse };

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ...errorResponse,
    });
  }
}
