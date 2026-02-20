/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para criação de reserva
 *
 * Regras de negócio:
 * - Usuário pode reservar livros indisponíveis (availableCopies = 0)
 * - Usuário não pode ter reserva duplicada para o mesmo livro
 * - Quando livro ficar disponível, reserva é notificada
 * - Reserva expira após 48 horas sem retirada
 */
export class CreateReservationDto {
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
}
