import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto, QueryReservationsDto } from './dto';
import { Prisma } from '@prisma/client';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import {
  MESSAGING_EVENTS,
  ReservationConfirmedEvent,
} from '../messaging';

/**
 * Service para gerenciamento de reservas
 *
 * Implementa:
 * - Criação de reservas (com validações)
 * - Fila de espera (FIFO - First In, First Out)
 * - Cancelamento de reservas
 * - Conversão de reserva em empréstimo
 * - Notificações quando livro fica disponível
 */
@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
  ) {}

  /**
   * Criar nova reserva
   *
   * Validações:
   * 1. Livro existe
   * 2. Usuário existe
   * 3. Usuário não tem reserva duplicada para este livro
   * 4. Usuário não tem empréstimo ativo deste livro
   * 5. Livro está realmente indisponível (availableCopies = 0)
   */
  async create(createReservationDto: CreateReservationDto) {
    const { userId, bookId } = createReservationDto;

    // 1. Validar existência do livro
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true, title: true, availableCopies: true },
    });

    if (!book) {
      throw new NotFoundException(`Livro com ID ${bookId} não encontrado`);
    }

    // 2. Verificar se livro está disponível (não precisa reservar)
    if (book.availableCopies > 0) {
      throw new BadRequestException(
        `Livro "${book.title}" está disponível (${book.availableCopies} cópia(s)). ` +
          `Não é necessário fazer reserva. Realize o empréstimo diretamente.`,
      );
    }

    // 3. Validar existência do usuário
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    // 4. Verificar se usuário já tem reserva ativa para este livro
    const existingReservation = await this.prisma.reservation.findFirst({
      where: {
        userId,
        bookId,
        status: 'PENDING',
      },
    });

    if (existingReservation) {
      throw new ConflictException(
        `Usuário ${user.name} já possui reserva ativa para o livro "${book.title}"`,
      );
    }

    // 5. Verificar se usuário já tem empréstimo ativo deste livro
    const activeLoan = await this.prisma.loan.findFirst({
      where: {
        userId,
        bookId,
        status: 'ACTIVE',
      },
    });

    if (activeLoan) {
      throw new ConflictException(
        `Usuário ${user.name} já possui empréstimo ativo do livro "${book.title}"`,
      );
    }

    // 6. Verificar posição na fila
    const queuePosition = await this.prisma.reservation.count({
      where: {
        bookId,
        status: 'PENDING',
      },
    });

    // 7. Criar reserva
    const reservation = await this.prisma.reservation.create({
      data: {
        userId,
        bookId,
        status: 'PENDING',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        book: {
          select: { id: true, title: true, isbn: true },
        },
      },
    });

    return {
      message: 'Reserva criada com sucesso',
      reservation,
      queuePosition: queuePosition + 1, // Posição do usuário na fila (começa em 1)
    };
  }

  /**
   * Cancelar reserva
   *
   * Apenas reservas com status PENDING ou CONFIRMED podem ser canceladas
   */
  async cancel(id: number) {
    // 1. Buscar reserva
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true } },
        book: { select: { id: true, title: true } },
      },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva com ID ${id} não encontrada`);
    }

    // 2. Verificar se pode cancelar
    if (reservation.status === 'CANCELLED') {
      throw new BadRequestException('Esta reserva já foi cancelada');
    }

    if (reservation.status === 'FULFILLED') {
      throw new BadRequestException(
        'Não é possível cancelar reserva já atendida (transformada em empréstimo)',
      );
    }

    // 3. Atualizar status
    const updatedReservation = await this.prisma.reservation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        book: { select: { id: true, title: true, isbn: true } },
      },
    });

    return {
      message: 'Reserva cancelada com sucesso',
      reservation: updatedReservation,
    };
  }

  /**
   * Confirmar reserva (quando livro fica disponível)
   *
   * Usado internamente quando:
   * - Livro é devolvido
   * - Há reservas pendentes na fila
   *
   * Confirma apenas a PRIMEIRA reserva (FIFO)
   */
  async confirmReservation(bookId: number) {
    // Buscar primeira reserva pendente (FIFO)
    const nextReservation = await this.prisma.reservation.findFirst({
      where: {
        bookId,
        status: 'PENDING',
      },
      orderBy: {
        reservationDate: 'asc', // Mais antiga primeiro
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        book: { select: { id: true, title: true } },
      },
    });

    if (!nextReservation) {
      return null; // Não há reservas pendentes
    }

    // Atualizar status para CONFIRMED
    const confirmedReservation = await this.prisma.reservation.update({
      where: { id: nextReservation.id },
      data: {
        status: 'CONFIRMED',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        book: { select: { id: true, title: true, isbn: true } },
      },
    });

    // 🔥 MENSAGERIA: Emitir evento de reserva confirmada
    const event: ReservationConfirmedEvent = {
      reservationId: confirmedReservation.id,
      userId: confirmedReservation.user.id,
      userEmail: confirmedReservation.user.email,
      userName: confirmedReservation.user.name,
      bookId: confirmedReservation.book.id,
      bookTitle: confirmedReservation.book.title,
    };
    this.rabbitClient.emit(MESSAGING_EVENTS.RESERVATION_CONFIRMED, event);

    return {
      message: 'Reserva confirmada. Usuário foi notificado.',
      reservation: confirmedReservation,
    };
  }

  /**
   * Marcar reserva como FULFILLED (atendida)
   *
   * Chamado quando reserva confirmada é transformada em empréstimo
   */
  async fulfill(id: number) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva com ID ${id} não encontrada`);
    }

    if (reservation.status !== 'CONFIRMED') {
      throw new BadRequestException(
        'Apenas reservas confirmadas podem ser atendidas',
      );
    }

    const updatedReservation = await this.prisma.reservation.update({
      where: { id },
      data: {
        status: 'FULFILLED',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        book: { select: { id: true, title: true, isbn: true } },
      },
    });

    return {
      message: 'Reserva atendida com sucesso',
      reservation: updatedReservation,
    };
  }

  /**
   * Listar reservas com filtros e paginação
   */
  async findAll(query: QueryReservationsDto) {
    const { userId, bookId, status, sortBy, sortOrder } = query;

    // Construir WHERE dinamicamente
    const where: Prisma.ReservationWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (bookId) {
      where.bookId = bookId;
    }

    if (status) {
      where.status = status;
    }

    // Ordenação
    const orderBy: Prisma.ReservationOrderByWithRelationInput = {
      [sortBy || 'reservationDate']: sortOrder || 'asc',
    };

    // Paginação
    const skip = query.getSkip();
    const take = query.getTake();

    // Executar queries em paralelo
    const [reservations, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          book: {
            select: {
              id: true,
              title: true,
              isbn: true,
              availableCopies: true,
            },
          },
        },
      }),
      this.prisma.reservation.count({ where }),
    ]);

    const page = query.page || Math.floor(skip / take) + 1;

    return new PaginatedResponseDto(reservations, total, page, take);
  }

  /**
   * Buscar reserva por ID
   */
  async findOne(id: number) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        book: {
          select: {
            id: true,
            title: true,
            isbn: true,
            description: true,
            availableCopies: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva com ID ${id} não encontrada`);
    }

    // Calcular posição na fila (se ainda estiver PENDING)
    let queuePosition: number | null = null;
    if (reservation.status === 'PENDING') {
      queuePosition = await this.prisma.reservation.count({
        where: {
          bookId: reservation.bookId,
          status: 'PENDING',
          reservationDate: {
            lte: reservation.reservationDate,
          },
        },
      });
    }

    return {
      ...reservation,
      queuePosition,
    };
  }

  /**
   * Obter fila de espera de um livro
   */
  async getBookQueue(bookId: number) {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true, title: true, availableCopies: true },
    });

    if (!book) {
      throw new NotFoundException(`Livro com ID ${bookId} não encontrado`);
    }

    const queue = await this.prisma.reservation.findMany({
      where: {
        bookId,
        status: 'PENDING',
      },
      orderBy: {
        reservationDate: 'asc', // FIFO
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return {
      book,
      queueLength: queue.length,
      queue: queue.map((reservation, index) => ({
        position: index + 1,
        reservationId: reservation.id,
        user: reservation.user,
        reservationDate: reservation.reservationDate,
      })),
    };
  }
}
