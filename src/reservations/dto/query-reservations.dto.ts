/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsOptional, IsInt, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

/**
 * Enum de Status da Reserva
 * Deve corresponder ao enum ReservationStatus no Prisma Schema
 */
export enum ReservationStatus {
  PENDING = 'PENDING', // Aguardando disponibilidade
  CONFIRMED = 'CONFIRMED', // Livro disponível, aguardando retirada
  CANCELLED = 'CANCELLED', // Cancelada pelo usuário ou sistema
  FULFILLED = 'FULFILLED', // Reserva atendida (transformou em empréstimo)
}

/**
 * DTO para consulta/filtros de reservas
 *
 * Permite filtrar por:
 * - Usuário (todas reservas de um usuário)
 * - Livro (fila de espera de um livro)
 * - Status (pendentes, confirmadas, canceladas, atendidas)
 *
 * Suporta paginação e ordenação
 */
export class QueryReservationsDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID do usuário deve ser um número inteiro' })
  userId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID do livro deve ser um número inteiro' })
  bookId?: number;

  @IsOptional()
  @IsEnum(ReservationStatus, {
    message: 'Status deve ser PENDING, CONFIRMED, CANCELLED ou FULFILLED',
  })
  status?: ReservationStatus;

  @IsOptional()
  @IsEnum(['reservationDate', 'createdAt'], {
    message: 'Campo de ordenação deve ser reservationDate ou createdAt',
  })
  sortBy?: string = 'reservationDate';

  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: 'Ordem deve ser asc ou desc' })
  sortOrder?: 'asc' | 'desc' = 'asc'; // FIFO (First In, First Out)
}
