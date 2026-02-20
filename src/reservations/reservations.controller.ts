import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto, QueryReservationsDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

/**
 * Controller para gerenciamento de reservas
 *
 * Endpoints:
 * - POST   /reservations            - Criar reserva
 * - GET    /reservations            - Listar reservas com filtros
 * - GET    /reservations/:id        - Buscar reserva por ID
 * - PATCH  /reservations/:id/cancel - Cancelar reserva
 * - PATCH  /reservations/:id/fulfill - Marcar como atendida
 * - GET    /reservations/book/:bookId/queue - Fila de espera do livro
 */
@Controller({ path: 'reservations', version: '1' })
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  /**
   * Criar nova reserva
   *
   * Apenas ADMIN e LIBRARIAN podem criar reservas
   *
   * @example POST /reservations
   * {
   *   "userId": 1,
   *   "bookId": 5
   * }
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationsService.create(createReservationDto);
  }

  /**
   * Listar reservas com filtros e paginação
   *
   * @example GET /reservations?userId=1&status=PENDING
   * @example GET /reservations?bookId=5 (ver fila de espera)
   * @example GET /reservations?status=CONFIRMED (reservas prontas)
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  findAll(@Query() query: QueryReservationsDto) {
    return this.reservationsService.findAll(query);
  }

  /**
   * Buscar reserva por ID
   *
   * @example GET /reservations/1
   *
   * Retorna informações completas + posição na fila (se PENDING)
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.findOne(id);
  }

  /**
   * Obter fila de espera de um livro
   *
   * @example GET /reservations/book/5/queue
   *
   * Retorna:
   * - Informações do livro
   * - Tamanho da fila
   * - Lista ordenada de reservas (FIFO)
   */
  @Get('book/:bookId/queue')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  getBookQueue(@Param('bookId', ParseIntPipe) bookId: number) {
    return this.reservationsService.getBookQueue(bookId);
  }

  /**
   * Cancelar reserva
   *
   * @example PATCH /reservations/1/cancel
   *
   * Pode cancelar reservas PENDING ou CONFIRMED
   */
  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.cancel(id);
  }

  /**
   * Marcar reserva como atendida (FULFILLED)
   *
   * @example PATCH /reservations/1/fulfill
   *
   * Usado quando reserva confirmada é transformada em empréstimo
   */
  @Patch(':id/fulfill')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @HttpCode(HttpStatus.OK)
  fulfill(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.fulfill(id);
  }
}
