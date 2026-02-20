/**
 * Prisma Exception Filter
 *
 * Conceitos NestJS:
 * - Exception Filters capturam exceções lançadas na aplicação
 * - Permitem customizar a resposta de erro
 * - Melhoram a experiência do usuário da API
 *
 * Este filter captura erros específicos do Prisma:
 * - P2002: Unique constraint violation (ex: email duplicado)
 * - P2025: Record not found (ex: livro não encontrado)
 * - P2003: Foreign key constraint failed (ex: categoria não existe)
 * - P2014: Relation violation (ex: deletar categoria com livros)
 *
 * Documentação Prisma Error Codes:
 * https://www.prisma.io/docs/reference/api-reference/error-reference
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor';

    switch (exception.code) {
      case 'P2002': {
        // Unique constraint violation
        status = HttpStatus.CONFLICT;
        const target = exception.meta?.target as string[];
        message = `Já existe um registro com ${target ? target.join(', ') : 'este valor'}`;
        break;
      }

      case 'P2025':
        // Record not found
        status = HttpStatus.NOT_FOUND;
        message = 'Registro não encontrado';
        break;

      case 'P2003': {
        // Foreign key constraint failed
        status = HttpStatus.BAD_REQUEST;
        const field = exception.meta?.field_name as string;
        message = `Chave estrangeira inválida: ${field || 'registro relacionado não existe'}`;
        break;
      }

      case 'P2014':
        // Relation violation (ex: deletar categoria com livros)
        status = HttpStatus.BAD_REQUEST;
        message =
          'Não é possível deletar este registro pois existem registros relacionados';
        break;

      case 'P2021':
        // Table does not exist
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Erro de configuração do banco de dados';
        break;

      case 'P2022':
        // Column does not exist
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Erro de configuração do banco de dados';
        break;

      default:
        // Outros erros do Prisma
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Erro ao processar requisição no banco de dados';
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: exception.code,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest<Request>().url,
    });
  }
}
