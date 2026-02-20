import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para renovação de empréstimo
 *
 * Regras de negócio:
 * - Máximo 2 renovações por empréstimo (renewalCount)
 * - Não pode renovar se tiver multas pendentes
 * - Não pode renovar se houver reserva ativa para o livro
 * - Cada renovação adiciona 14 dias à dueDate
 */
export class RenewLoanDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Dias adicionais deve ser um número inteiro' })
  @Min(7, { message: 'Mínimo de 7 dias adicionais' })
  @Max(30, { message: 'Máximo de 30 dias adicionais' })
  additionalDays?: number = 14; // Padrão: 14 dias
}
