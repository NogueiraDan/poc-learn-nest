/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsOptional, IsDateString } from 'class-validator';

/**
 * DTO para devolução de livro
 *
 * - returnDate opcional (se não informado, usa data/hora atual)
 * - Service calculará automaticamente multa por atraso
 * - Service atualizará status para RETURNED
 * - Service incrementará availableCopies do livro
 */
export class ReturnLoanDto {
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Data de devolução deve estar no formato ISO 8601' },
  )
  returnDate?: string; // Se não fornecido, usa data/hora atual
}
