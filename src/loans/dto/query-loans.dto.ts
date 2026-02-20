import { IsOptional, IsInt, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

/**
 * Enum de Status do Empréstimo
 * Deve corresponder ao enum LoanStatus no Prisma Schema
 */
export enum LoanStatus {
  ACTIVE = 'ACTIVE',
  RETURNED = 'RETURNED',
  OVERDUE = 'OVERDUE',
}

/**
 * DTO para consulta/filtros de empréstimos
 *
 * Permite filtrar por:
 * - Usuário (todos empréstimos de um usuário)
 * - Livro (histórico de empréstimos de um livro)
 * - Status (ativos, devolvidos, atrasados)
 * - Período (range de datas)
 *
 * Suporta paginação e ordenação
 */
export class QueryLoansDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID do usuário deve ser um número inteiro' })
  userId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID do livro deve ser um número inteiro' })
  bookId?: number;

  @IsOptional()
  @IsEnum(LoanStatus, {
    message: 'Status deve ser ACTIVE, RETURNED ou OVERDUE',
  })
  status?: LoanStatus;

  @IsOptional()
  @IsDateString({}, { message: 'Data inicial deve estar no formato ISO 8601' })
  loanDateFrom?: string; // Empréstimos a partir desta data

  @IsOptional()
  @IsDateString({}, { message: 'Data final deve estar no formato ISO 8601' })
  loanDateTo?: string; // Empréstimos até esta data

  @IsOptional()
  @IsEnum(['loanDate', 'dueDate', 'returnDate', 'createdAt'], {
    message:
      'Campo de ordenação deve ser loanDate, dueDate, returnDate ou createdAt',
  })
  sortBy?: string = 'loanDate';

  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: 'Ordem deve ser asc ou desc' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}
