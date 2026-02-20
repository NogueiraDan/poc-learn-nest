/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateLoanDto,
  ReturnLoanDto,
  RenewLoanDto,
  QueryLoansDto,
} from './dto';
import { Prisma } from '@prisma/client';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { ReservationsService } from '../reservations/reservations.service';

/**
 * Service para gerenciamento de empréstimos
 *
 * Implementa regras de negócio complexas:
 * - Validações antes de emprestar
 * - Transações atômicas (loan + book update)
 * - Cálculo automático de multas
 * - Limite de empréstimos simultâneos
 * - Renovações com restrições
 * - Integração com reservas (confirmação automática)
 */
@Injectable()
export class LoansService {
  // Constantes de regras de negócio
  private readonly MAX_ACTIVE_LOANS = 3;
  private readonly DEFAULT_LOAN_DAYS = 14;
  private readonly MAX_RENEWALS = 2;
  private readonly DAILY_FINE_AMOUNT = 2.0; // R$ 2,00 por dia de atraso

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ReservationsService))
    private reservationsService: ReservationsService,
  ) {}

  /**
   * Criar novo empréstimo (emprestar livro)
   *
   * Validações:
   * 1. Livro existe e está disponível
   * 2. Usuário existe
   * 3. Usuário não tem empréstimos atrasados
   * 4. Usuário não atingiu limite de empréstimos simultâneos
   * 5. Usuário não tem multas pendentes
   *
   * Operação atômica (transação):
   * - Cria loan
   * - Decrementa availableCopies do livro
   */
  async create(createLoanDto: CreateLoanDto) {
    const { userId, bookId, dueDate } = createLoanDto;

    // 1. Validar existência do livro
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true, title: true, availableCopies: true },
    });

    if (!book) {
      throw new NotFoundException(`Livro com ID ${bookId} não encontrado`);
    }

    // 2. Verificar se livro está disponível
    if (book.availableCopies <= 0) {
      throw new BadRequestException(
        `Livro "${book.title}" não está disponível no momento. Considere fazer uma reserva.`,
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

    // 4. Verificar empréstimos atrasados
    const overdueLoans = await this.prisma.loan.count({
      where: {
        userId,
        status: 'OVERDUE',
      },
    });

    if (overdueLoans > 0) {
      throw new BadRequestException(
        `Usuário ${user.name} possui ${overdueLoans} empréstimo(s) atrasado(s). ` +
          `Devolva os livros atrasados antes de fazer novo empréstimo.`,
      );
    }

    // 5. Verificar multas pendentes
    const pendingFines = await this.prisma.fine.count({
      where: {
        userId,
        status: 'PENDING',
      },
    });

    if (pendingFines > 0) {
      throw new BadRequestException(
        `Usuário ${user.name} possui ${pendingFines} multa(s) pendente(s). ` +
          `Pague as multas antes de fazer novo empréstimo.`,
      );
    }

    // 6. Verificar limite de empréstimos simultâneos
    const activeLoans = await this.prisma.loan.count({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    if (activeLoans >= this.MAX_ACTIVE_LOANS) {
      throw new BadRequestException(
        `Usuário ${user.name} já possui ${activeLoans} empréstimo(s) ativo(s). ` +
          `Limite máximo: ${this.MAX_ACTIVE_LOANS}.`,
      );
    }

    // 7. Calcular dueDate (se não fornecida)
    const calculatedDueDate = dueDate
      ? new Date(dueDate)
      : this.calculateDueDate(this.DEFAULT_LOAN_DAYS);

    // 8. Criar empréstimo e atualizar livro em TRANSAÇÃO
    const loan = await this.prisma.$transaction(async (prisma) => {
      // Cria o empréstimo
      const newLoan = await prisma.loan.create({
        data: {
          userId,
          bookId,
          dueDate: calculatedDueDate,
          status: 'ACTIVE',
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          book: {
            select: {
              id: true,
              title: true,
              isbn: true,
            },
          },
        },
      });

      // Decrementa cópias disponíveis
      await prisma.book.update({
        where: { id: bookId },
        data: {
          availableCopies: {
            decrement: 1,
          },
        },
      });

      return newLoan;
    });

    return {
      message: 'Empréstimo realizado com sucesso',
      loan,
    };
  }

  /**
   * Devolver livro (return)
   *
   * Validações:
   * 1. Empréstimo existe
   * 2. Empréstimo está ativo (não foi devolvido)
   *
   * Ações:
   * - Atualiza returnDate
   * - Atualiza status para RETURNED
   * - Incrementa availableCopies do livro
   * - Se atrasado, cria multa automaticamente
   */
  async returnBook(id: number, returnLoanDto: ReturnLoanDto) {
    // 1. Buscar empréstimo
    const loan = await this.prisma.loan.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true } },
        book: { select: { id: true, title: true } },
      },
    });

    if (!loan) {
      throw new NotFoundException(`Empréstimo com ID ${id} não encontrado`);
    }

    // 2. Verificar se já foi devolvido
    if (loan.status === 'RETURNED') {
      throw new BadRequestException(
        `Este empréstimo já foi devolvido em ${loan.returnDate?.toISOString()}`,
      );
    }

    // 3. Calcular returnDate
    const returnDate = returnLoanDto.returnDate
      ? new Date(returnLoanDto.returnDate)
      : new Date();

    // 4. Verificar se está atrasado
    const isOverdue = returnDate > loan.dueDate;
    const daysOverdue = isOverdue
      ? Math.ceil(
          (returnDate.getTime() - loan.dueDate.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    // 5. Atualizar empréstimo e livro em TRANSAÇÃO
    const result = await this.prisma.$transaction(async (prisma) => {
      // Atualiza o empréstimo
      const updatedLoan = await prisma.loan.update({
        where: { id },
        data: {
          returnDate,
          status: 'RETURNED',
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          book: { select: { id: true, title: true, isbn: true } },
        },
      });

      // Incrementa cópias disponíveis
      await prisma.book.update({
        where: { id: loan.bookId },
        data: {
          availableCopies: {
            increment: 1,
          },
        },
      });

      // Se atrasado, cria multa
      let fine: any = null;
      if (isOverdue) {
        const fineAmount = daysOverdue * this.DAILY_FINE_AMOUNT;
        fine = await prisma.fine.create({
          data: {
            userId: loan.userId,
            loanId: loan.id,
            amount: fineAmount,
            reason: `Atraso de ${daysOverdue} dia(s) na devolução do livro "${loan.book.title}"`,
            status: 'PENDING',
          },
        });
      }

      return { loan: updatedLoan, fine };
    });

    // 6. Verificar se há reservas pendentes e confirmar a primeira
    let confirmedReservation: any = null;
    try {
      const reservationResult =
        await this.reservationsService.confirmReservation(loan.bookId);
      if (reservationResult) {
        confirmedReservation = reservationResult.reservation;
      }
    } catch (error) {
      // Log do erro mas não falha a devolução
      console.error('Erro ao confirmar reserva:', error);
    }

    const message =
      isOverdue && result.fine
        ? `Livro devolvido com ${daysOverdue} dia(s) de atraso. Multa de R$ ${result.fine.amount.toFixed(2)} gerada.`
        : 'Livro devolvido com sucesso';

    return {
      message,
      loan: result.loan,
      fine: result.fine,
      daysOverdue: isOverdue ? daysOverdue : 0,
      confirmedReservation,
    };
  }

  /**
   * Renovar empréstimo (estender prazo)
   *
   * Validações:
   * 1. Empréstimo existe e está ativo
   * 2. Não excedeu limite de renovações (MAX_RENEWALS)
   * 3. Não tem multas pendentes
   * 4. Não há reserva ativa para este livro
   *
   * Ação:
   * - Incrementa renewalCount
   * - Adiciona dias à dueDate
   */
  async renewLoan(id: number, renewLoanDto: RenewLoanDto) {
    // 1. Buscar empréstimo
    const loan = await this.prisma.loan.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true } },
        book: { select: { id: true, title: true } },
      },
    });

    if (!loan) {
      throw new NotFoundException(`Empréstimo com ID ${id} não encontrado`);
    }

    // 2. Verificar se está ativo
    if (loan.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Não é possível renovar empréstimo com status ${loan.status}`,
      );
    }

    // 3. Verificar limite de renovações
    if (loan.renewalCount >= this.MAX_RENEWALS) {
      throw new BadRequestException(
        `Limite de ${this.MAX_RENEWALS} renovações já atingido para este empréstimo`,
      );
    }

    // 4. Verificar multas pendentes
    const pendingFines = await this.prisma.fine.count({
      where: {
        userId: loan.userId,
        status: 'PENDING',
      },
    });

    if (pendingFines > 0) {
      throw new BadRequestException(
        `Usuário ${loan.user.name} possui multas pendentes. ` +
          `Pague as multas antes de renovar.`,
      );
    }

    // 5. Verificar se há reservas ativas para este livro
    const activeReservations = await this.prisma.reservation.count({
      where: {
        bookId: loan.bookId,
        status: 'PENDING',
      },
    });

    if (activeReservations > 0) {
      throw new ConflictException(
        `Não é possível renovar. Há ${activeReservations} reserva(s) ativa(s) para o livro "${loan.book.title}"`,
      );
    }

    // 6. Calcular nova dueDate
    const additionalDays =
      renewLoanDto.additionalDays || this.DEFAULT_LOAN_DAYS;
    const newDueDate = new Date(loan.dueDate);
    newDueDate.setDate(newDueDate.getDate() + additionalDays);

    // 7. Atualizar empréstimo
    const updatedLoan = await this.prisma.loan.update({
      where: { id },
      data: {
        dueDate: newDueDate,
        renewalCount: {
          increment: 1,
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        book: { select: { id: true, title: true, isbn: true } },
      },
    });

    return {
      message: `Empréstimo renovado com sucesso. Nova data de devolução: ${newDueDate.toISOString().split('T')[0]}`,
      loan: updatedLoan,
      renewalsRemaining: this.MAX_RENEWALS - updatedLoan.renewalCount,
    };
  }

  /**
   * Listar empréstimos com filtros e paginação
   */
  async findAll(query: QueryLoansDto) {
    const {
      userId,
      bookId,
      status,
      loanDateFrom,
      loanDateTo,
      sortBy,
      sortOrder,
    } = query;

    // Construir WHERE dinamicamente
    const where: Prisma.LoanWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (bookId) {
      where.bookId = bookId;
    }

    if (status) {
      where.status = status;
    }

    // Range de datas
    if (loanDateFrom || loanDateTo) {
      where.loanDate = {};
      if (loanDateFrom) {
        where.loanDate.gte = new Date(loanDateFrom);
      }
      if (loanDateTo) {
        where.loanDate.lte = new Date(loanDateTo);
      }
    }

    // Ordenação
    const orderBy: Prisma.LoanOrderByWithRelationInput = {
      [sortBy || 'loanDate']: sortOrder || 'desc',
    };

    // Paginação
    const skip = query.getSkip();
    const take = query.getTake();

    // Executar queries em paralelo
    const [loans, total] = await Promise.all([
      this.prisma.loan.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          book: {
            select: { id: true, title: true, isbn: true },
          },
          fines: {
            select: { id: true, amount: true, status: true, reason: true },
          },
        },
      }),
      this.prisma.loan.count({ where }),
    ]);

    const page = query.page || Math.floor(skip / take) + 1;

    return new PaginatedResponseDto(loans, total, page, take);
  }

  /**
   * Buscar empréstimo por ID
   */
  async findOne(id: number) {
    const loan = await this.prisma.loan.findUnique({
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
        fines: true,
      },
    });

    if (!loan) {
      throw new NotFoundException(`Empréstimo com ID ${id} não encontrado`);
    }

    return loan;
  }

  /**
   * Obter estatísticas de empréstimos de um usuário
   */
  async getUserLoanStats(userId: number) {
    const stats = await this.prisma.loan.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    });

    const totalFines = await this.prisma.fine.aggregate({
      where: {
        userId,
        status: 'PENDING',
      },
      _sum: { amount: true },
      _count: true,
    });

    return {
      userId,
      loansByStatus: stats.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      pendingFines: {
        count: totalFines._count,
        totalAmount: totalFines._sum.amount || 0,
      },
    };
  }

  /**
   * Helper: Calcular data de devolução
   */
  private calculateDueDate(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}
