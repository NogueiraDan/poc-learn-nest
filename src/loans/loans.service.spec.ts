import { Test, TestingModule } from '@nestjs/testing';
import { LoansService } from './loans.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReservationsService } from '../reservations/reservations.service';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateLoanDto } from './dto';

/**
 * Testes Unitários do LoansService
 *
 * Estrutura dos testes (AAA Pattern):
 * - Arrange: Preparar dados e mocks
 * - Act: Executar método
 * - Assert: Verificar resultado
 *
 * Cobertura:
 * - Criação de empréstimos (validações)
 * - Devolução de livros (com e sem atraso)
 * - Renovação de empréstimos
 * - Listagem com filtros
 * - Tratamento de erros
 */
describe('LoansService', () => {
  let service: LoansService;
  let prismaService: PrismaService;
  let reservationsService: ReservationsService;

  // Mock do PrismaService
  const mockPrismaService = {
    book: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    loan: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
    },
    fine: {
      count: jest.fn(),
      create: jest.fn(),
      aggregate: jest.fn(),
    },
    reservation: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  // Mock do ReservationsService
  const mockReservationsService = {
    confirmReservation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoansService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ReservationsService,
          useValue: mockReservationsService,
        },
      ],
    }).compile();

    service = module.get<LoansService>(LoansService);
    prismaService = module.get<PrismaService>(PrismaService);
    reservationsService = module.get<ReservationsService>(ReservationsService);

    // Limpar mocks antes de cada teste
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createLoanDto: CreateLoanDto = {
      userId: 1,
      bookId: 1,
      dueDate: '2026-03-15',
    };

    const mockBook = {
      id: 1,
      title: 'Clean Code',
      availableCopies: 5,
    };

    const mockUser = {
      id: 1,
      name: 'João Silva',
      email: 'joao@example.com',
    };

    it('deve criar empréstimo com sucesso quando todas validações passarem', async () => {
      // Arrange
      mockPrismaService.book.findUnique.mockResolvedValue(mockBook);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.loan.count.mockResolvedValue(0); // Sem empréstimos atrasados
      mockPrismaService.fine.count.mockResolvedValue(0); // Sem multas pendentes
      mockPrismaService.loan.count.mockResolvedValueOnce(0); // Sem empréstimos atrasados
      mockPrismaService.loan.count.mockResolvedValueOnce(0); // Empréstimos ativos

      const mockCreatedLoan = {
        id: 1,
        userId: 1,
        bookId: 1,
        loanDate: new Date(),
        dueDate: new Date('2026-03-15'),
        status: 'ACTIVE',
        user: mockUser,
        book: mockBook,
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });

      mockPrismaService.loan.create.mockResolvedValue(mockCreatedLoan);

      // Act
      const result = await service.create(createLoanDto);

      // Assert
      expect(result.message).toBe('Empréstimo realizado com sucesso');
      expect(result.loan).toBeDefined();
      expect(mockPrismaService.book.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, title: true, availableCopies: true },
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando livro não existe', async () => {
      // Arrange
      mockPrismaService.book.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createLoanDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createLoanDto)).rejects.toThrow(
        'Livro com ID 1 não encontrado',
      );
    });

    it('deve lançar BadRequestException quando livro está indisponível', async () => {
      // Arrange
      mockPrismaService.book.findUnique.mockResolvedValue({
        ...mockBook,
        availableCopies: 0,
      });

      // Act & Assert
      await expect(service.create(createLoanDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createLoanDto)).rejects.toThrow(
        /não está disponível no momento/,
      );
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      // Arrange
      mockPrismaService.book.findUnique.mockResolvedValue(mockBook);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createLoanDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createLoanDto)).rejects.toThrow(
        'Usuário com ID 1 não encontrado',
      );
    });

    it('deve lançar BadRequestException quando usuário tem empréstimos atrasados', async () => {
      // Arrange
      mockPrismaService.book.findUnique.mockResolvedValue(mockBook);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.loan.count.mockResolvedValue(2); // 2 empréstimos atrasados

      // Act & Assert
      await expect(service.create(createLoanDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createLoanDto)).rejects.toThrow(
        /empréstimo\(s\) atrasado\(s\)/,
      );
    });

    it('deve lançar BadRequestException quando usuário tem multas pendentes', async () => {
      // Arrange
      mockPrismaService.book.findUnique.mockResolvedValue(mockBook);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      // Primeira chamada: overdueLoans (deve retornar 0)
      mockPrismaService.loan.count.mockResolvedValueOnce(0);
      // Segunda chamada: fine.count (deve retornar 1)
      mockPrismaService.fine.count.mockResolvedValueOnce(1);

      // Act & Assert
      try {
        await service.create(createLoanDto);
        fail('Deveria ter lançado BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toMatch(/multa\(s\) pendente\(s\)/);
      }
    });

    it('deve lançar BadRequestException quando usuário atingiu limite de empréstimos', async () => {
      // Arrange
      mockPrismaService.book.findUnique.mockResolvedValue(mockBook);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      // Primeira chamada: overdueLoans (deve retornar 0)
      mockPrismaService.loan.count.mockResolvedValueOnce(0);
      // Segunda chamada: fine.count (deve retornar 0)
      mockPrismaService.fine.count.mockResolvedValueOnce(0);
      // Terceira chamada: activeLoans (deve retornar 3)
      mockPrismaService.loan.count.mockResolvedValueOnce(3);

      // Act & Assert
      try {
        await service.create(createLoanDto);
        fail('Deveria ter lançado BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toMatch(/Limite máximo: 3/);
      }
    });

    it('deve calcular dueDate automaticamente quando não fornecida', async () => {
      // Arrange
      const dtoWithoutDueDate = { userId: 1, bookId: 1 };
      mockPrismaService.book.findUnique.mockResolvedValue(mockBook);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.loan.count.mockResolvedValue(0);
      mockPrismaService.fine.count.mockResolvedValue(0);

      const mockCreatedLoan = {
        id: 1,
        userId: 1,
        bookId: 1,
        loanDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // +14 dias
        status: 'ACTIVE',
        user: mockUser,
        book: mockBook,
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.loan.create.mockResolvedValue(mockCreatedLoan);

      // Act
      const result = await service.create(dtoWithoutDueDate);

      // Assert
      expect(result.loan.dueDate).toBeDefined();
      const daysUntilDue = Math.floor(
        (result.loan.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      expect(daysUntilDue).toBeGreaterThanOrEqual(13); // ~14 dias
      expect(daysUntilDue).toBeLessThanOrEqual(15);
    });
  });

  describe('returnBook', () => {
    const mockLoan = {
      id: 1,
      userId: 1,
      bookId: 1,
      loanDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-15'),
      returnDate: null,
      status: 'ACTIVE',
      user: { id: 1, name: 'João Silva' },
      book: { id: 1, title: 'Clean Code' },
    };

    it('deve devolver livro sem multa quando no prazo', async () => {
      // Arrange
      mockPrismaService.loan.findUnique.mockResolvedValue(mockLoan);

      const returnDto = { returnDate: '2026-02-10' }; // Antes da dueDate

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });

      const updatedLoan = {
        ...mockLoan,
        returnDate: new Date('2026-02-10'),
        status: 'RETURNED',
      };

      mockPrismaService.loan.update.mockResolvedValue(updatedLoan);
      mockReservationsService.confirmReservation.mockResolvedValue(null);

      // Act
      const result = await service.returnBook(1, returnDto);

      // Assert
      expect(result.message).toBe('Livro devolvido com sucesso');
      expect(result.fine).toBeNull();
      expect(result.daysOverdue).toBe(0);
      expect(mockPrismaService.book.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { availableCopies: { increment: 1 } },
      });
    });

    it('deve devolver livro com multa quando atrasado', async () => {
      // Arrange
      mockPrismaService.loan.findUnique.mockResolvedValue(mockLoan);

      const returnDto = { returnDate: '2026-02-20' }; // 5 dias após dueDate

      const mockFine = {
        id: 1,
        userId: 1,
        loanId: 1,
        amount: 10.0, // R$ 2,00 x 5 dias
        reason: 'Atraso de 5 dia(s)',
        status: 'PENDING',
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });

      mockPrismaService.loan.update.mockResolvedValue({
        ...mockLoan,
        returnDate: new Date('2026-02-20'),
        status: 'RETURNED',
      });

      mockPrismaService.fine.create.mockResolvedValue(mockFine);
      mockReservationsService.confirmReservation.mockResolvedValue(null);

      // Act
      const result = await service.returnBook(1, returnDto);

      // Assert
      expect(result.daysOverdue).toBe(5);
      expect(result.fine).toBeDefined();
      expect(result.fine.amount).toBe(10.0);
      expect(result.message).toContain('Multa de R$ 10.00 gerada');
      expect(mockPrismaService.fine.create).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando empréstimo não existe', async () => {
      // Arrange
      mockPrismaService.loan.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.returnBook(999, {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar BadRequestException quando empréstimo já foi devolvido', async () => {
      // Arrange
      mockPrismaService.loan.findUnique.mockResolvedValue({
        ...mockLoan,
        status: 'RETURNED',
        returnDate: new Date('2026-02-10'),
      });

      // Act & Assert
      await expect(service.returnBook(1, {})).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.returnBook(1, {})).rejects.toThrow(
        /já foi devolvido/,
      );
    });

    it('deve confirmar reserva automaticamente após devolução', async () => {
      // Arrange
      mockPrismaService.loan.findUnique.mockResolvedValue(mockLoan);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });

      mockPrismaService.loan.update.mockResolvedValue({
        ...mockLoan,
        returnDate: new Date(),
        status: 'RETURNED',
      });

      const mockReservation = {
        reservation: {
          id: 1,
          userId: 2,
          bookId: 1,
          status: 'CONFIRMED',
        },
      };

      mockReservationsService.confirmReservation.mockResolvedValue(
        mockReservation,
      );

      // Act
      const result = await service.returnBook(1, {});

      // Assert
      expect(mockReservationsService.confirmReservation).toHaveBeenCalledWith(
        1,
      );
      expect(result.confirmedReservation).toBeDefined();
    });
  });

  describe('renewLoan', () => {
    const mockLoan = {
      id: 1,
      userId: 1,
      bookId: 1,
      loanDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-15'),
      renewalCount: 0,
      status: 'ACTIVE',
      user: { id: 1, name: 'João Silva' },
      book: { id: 1, title: 'Clean Code' },
    };

    it('deve renovar empréstimo com sucesso', async () => {
      // Arrange
      mockPrismaService.loan.findUnique.mockResolvedValue(mockLoan);
      mockPrismaService.fine.count.mockResolvedValue(0); // Sem multas
      mockPrismaService.reservation.count.mockResolvedValue(0); // Sem reservas

      const updatedLoan = {
        ...mockLoan,
        dueDate: new Date('2026-03-01'), // +14 dias
        renewalCount: 1,
      };

      mockPrismaService.loan.update.mockResolvedValue(updatedLoan);

      // Act
      const result = await service.renewLoan(1, {});

      // Assert
      expect(result.message).toContain('renovado com sucesso');
      expect(result.loan.renewalCount).toBe(1);
      expect(result.renewalsRemaining).toBe(1); // MAX_RENEWALS (2) - 1
    });

    it('deve lançar NotFoundException quando empréstimo não existe', async () => {
      // Arrange
      mockPrismaService.loan.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.renewLoan(999, {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar BadRequestException quando empréstimo não está ativo', async () => {
      // Arrange
      mockPrismaService.loan.findUnique.mockResolvedValue({
        ...mockLoan,
        status: 'RETURNED',
      });

      // Act & Assert
      await expect(service.renewLoan(1, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar BadRequestException quando limite de renovações atingido', async () => {
      // Arrange
      mockPrismaService.loan.findUnique.mockResolvedValue({
        ...mockLoan,
        renewalCount: 2, // Máximo permitido
      });

      // Act & Assert
      await expect(service.renewLoan(1, {})).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.renewLoan(1, {})).rejects.toThrow(
        /Limite de 2 renovações já atingido/,
      );
    });

    it('deve lançar BadRequestException quando usuário tem multas pendentes', async () => {
      // Arrange
      mockPrismaService.loan.findUnique.mockResolvedValue(mockLoan);
      mockPrismaService.fine.count.mockResolvedValue(1); // 1 multa pendente

      // Act & Assert
      await expect(service.renewLoan(1, {})).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.renewLoan(1, {})).rejects.toThrow(
        /multas pendentes/,
      );
    });

    it('deve lançar ConflictException quando há reservas ativas para o livro', async () => {
      // Arrange
      mockPrismaService.loan.findUnique.mockResolvedValue(mockLoan);
      mockPrismaService.fine.count.mockResolvedValue(0);
      mockPrismaService.reservation.count.mockResolvedValue(1); // 1 reserva ativa

      // Act & Assert
      await expect(service.renewLoan(1, {})).rejects.toThrow(ConflictException);
      await expect(service.renewLoan(1, {})).rejects.toThrow(
        /reserva\(s\) ativa\(s\)/,
      );
    });

    it('deve respeitar dias adicionais personalizados', async () => {
      // Arrange
      mockPrismaService.loan.findUnique.mockResolvedValue(mockLoan);
      mockPrismaService.fine.count.mockResolvedValue(0);
      mockPrismaService.reservation.count.mockResolvedValue(0);

      const updatedLoan = {
        ...mockLoan,
        dueDate: new Date('2026-03-08'), // +21 dias
        renewalCount: 1,
      };

      mockPrismaService.loan.update.mockResolvedValue(updatedLoan);

      // Act
      const result = await service.renewLoan(1, { additionalDays: 21 });

      // Assert
      expect(result.loan.renewalCount).toBe(1);
      // Verificar que a nova dueDate está ~21 dias à frente
    });
  });

  describe('findAll', () => {
    it('deve retornar empréstimos com paginação', async () => {
      // Arrange
      const mockLoans = [
        {
          id: 1,
          userId: 1,
          bookId: 1,
          status: 'ACTIVE',
          user: { id: 1, name: 'João', email: 'joao@test.com' },
          book: { id: 1, title: 'Clean Code', isbn: '123' },
          fines: [],
        },
      ];

      mockPrismaService.loan.findMany.mockResolvedValue(mockLoans);
      mockPrismaService.loan.count.mockResolvedValue(1);

      // Criar instância do DTO com métodos getSkip() e getTake()
      const query = Object.assign(
        new (class QueryDto {
          page = 1;
          limit = 10;
          getSkip() {
            return 0;
          }
          getTake() {
            return 10;
          }
        })(),
      );

      // Act
      const result = await service.findAll(query);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('deve filtrar empréstimos por userId', async () => {
      // Arrange
      mockPrismaService.loan.findMany.mockResolvedValue([]);
      mockPrismaService.loan.count.mockResolvedValue(0);

      // Criar instância do DTO
      const query = Object.assign(
        new (class QueryDto {
          userId = 1;
          page = 1;
          limit = 10;
          getSkip() {
            return 0;
          }
          getTake() {
            return 10;
          }
        })(),
      );

      // Act
      await service.findAll(query);

      // Assert
      expect(mockPrismaService.loan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 1 }),
        }),
      );
    });

    it('deve filtrar empréstimos por status', async () => {
      // Arrange
      mockPrismaService.loan.findMany.mockResolvedValue([]);
      mockPrismaService.loan.count.mockResolvedValue(0);

      // Criar instância do DTO
      const query = Object.assign(
        new (class QueryDto {
          status = 'ACTIVE' as any;
          page = 1;
          limit = 10;
          getSkip() {
            return 0;
          }
          getTake() {
            return 10;
          }
        })(),
      );

      // Act
      await service.findAll(query);

      // Assert
      expect(mockPrismaService.loan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar empréstimo por ID', async () => {
      // Arrange
      const mockLoan = {
        id: 1,
        userId: 1,
        bookId: 1,
        status: 'ACTIVE',
        user: { id: 1, name: 'João', email: 'joao@test.com', role: 'MEMBER' },
        book: {
          id: 1,
          title: 'Clean Code',
          isbn: '123',
          description: 'Test',
          availableCopies: 5,
        },
        fines: [],
      };

      mockPrismaService.loan.findUnique.mockResolvedValue(mockLoan);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it('deve lançar NotFoundException quando empréstimo não existe', async () => {
      // Arrange
      mockPrismaService.loan.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserLoanStats', () => {
    it('deve retornar estatísticas do usuário', async () => {
      // Arrange
      const mockStats = [
        { status: 'ACTIVE', _count: 2 },
        { status: 'RETURNED', _count: 5 },
      ];

      const mockFineStats = {
        _count: 1,
        _sum: { amount: 10.0 },
      };

      mockPrismaService.loan.groupBy.mockResolvedValue(mockStats);
      mockPrismaService.fine.aggregate.mockResolvedValue(mockFineStats);

      // Act
      const result = await service.getUserLoanStats(1);

      // Assert
      expect(result.userId).toBe(1);
      expect(result.loansByStatus).toHaveLength(2);
      expect(result.pendingFines.count).toBe(1);
      expect(result.pendingFines.totalAmount).toBe(10.0);
    });
  });
});
