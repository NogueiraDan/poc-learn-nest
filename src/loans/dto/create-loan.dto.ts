/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsInt,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para criação de empréstimo
 *
 * Regras de negócio:
 * - userId e bookId obrigatórios
 * - dueDate pode ser fornecida ou calculada automaticamente (14 dias)
 * - Validações no service verificarão:
 *   * Livro disponível (availableCopies > 0)
 *   * Usuário sem empréstimos atrasados
 *   * Limite de empréstimos simultâneos (max 3)
 */
export class CreateLoanDto {
  @IsNotEmpty({ message: 'ID do usuário é obrigatório' })
  @Type(() => Number)
  @IsInt({ message: 'ID do usuário deve ser um número inteiro' })
  @Min(1, { message: 'ID do usuário deve ser maior que zero' })
  userId: number;

  @IsNotEmpty({ message: 'ID do livro é obrigatório' })
  @Type(() => Number)
  @IsInt({ message: 'ID do livro deve ser um número inteiro' })
  @Min(1, { message: 'ID do livro deve ser maior que zero' })
  bookId: number;

  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'Data de devolução deve estar no formato ISO 8601 (YYYY-MM-DD)',
    },
  )
  dueDate?: string; // Se não fornecido, será calculado automaticamente (+14 dias)
}
