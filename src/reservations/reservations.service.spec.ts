/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsService } from './reservations.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoansService } from '../loans/loans.service';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateReservationDto } from './dto';

/**
 * Testes Unitários do ReservationsService
 *
 * Cobertura:
 * - Criação de reservas (validações)
 * - Cancelamento de reservas
 * - Confirmação de reservas (FIFO)
 * - Atendimento de reservas
 * - Fila de espera
 */
describe('ReservationsService', () => {
  let service: ReservationsService;
  let prismaService: PrismaService;
  let loansService: LoansService;

  // Mock do PrismaService
  const mockPrismaService = {
    book: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    reservation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    loan: {
      findFirst: jest.fn(),
    },
  };

  // Mock do LoansService
  const mockLoansService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: LoansService,
          useValue: mockLoansService,
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    loansService = module.get<LoansService>(LoansService);

    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createReservationDto: CreateReservationDto = {
      userId: 1,
      bookId: 1,
    };

    const mockBook = {
      id: 1,
      title: 'Clean Code',
      availableCopies: 0, // Indisponível para reservar
    };

    const mockUser = {
      id: 1,
      name: 'João Silva',
      email: 'joao@example.com',
    };

    it('deve criar reserva quando livro está indisponível', async () => {
      // Arrange
      mockPrismaService.book.findUnique.mockResolvedValue(mockBook);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.reservation.findFirst.mockResolvedValue(null); // Sem reserva duplicada
      mockPrismaService.loan.findFirst.mockResolvedValue(null); // Sem empréstimo ativo
      mockPrismaService.reservation.count.mockResolvedValue(2); // 2 na fila

      const mockCreatedReservation = {
        id: 1,
        userId: 1,
        bookId: 1,
        reservationDate: new Date(),
        status: 'PENDING',
        user: mockUser,
        book: mockBook,
      };

      mockPrismaService.reservation.create.mockResolvedValue(
        mockCreatedReservation,
      );

      // Act
      const result = await service.create(createReservationDto);

      // Assert
      expect(result.message).toContain('Reserva criada com sucesso');
      expect(result.queuePosition).toBe(3); // 2 na fila + esta = posição 3
      expect(mockPrismaService.reservation.create).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando livro não existe', async () => {
      // Arrange
      mockPrismaService.book.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createReservationDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar BadRequestException quando livro está disponível', async () => {
      // Arrange
      mockPrismaService.book.findUnique.mockResolvedValue({
        ...mockBook,
        availableCopies: 5,
      });

      // Act & Assert
      try {
        await service.create(createReservationDto);
        fail('Deveria ter lançado BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toMatch(/está disponível/);
      }
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      // Arrange
      mockPrismaService.book.findUnique.mockResolvedValue(mockBook);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createReservationDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar ConflictException quando usuário já tem reserva ativa', async () => {
      // Arrange
      mockPrismaService.book.findUnique.mockResolvedValue(mockBook);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const existingReservation = {
        id: 1,
        userId: 1,
        bookId: 1,
        status: 'PENDING',
      };

      mockPrismaService.reservation.findFirst.mockResolvedValue(
        existingReservation,
      );

      // Act & Assert
      try {
        await service.create(createReservationDto);
        fail('Deveria ter lançado ConflictException');
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toMatch(/já possui reserva ativa/);
      }
    });

    it('deve lançar ConflictException quando usuário já tem empréstimo ativo', async () => {
      // Arrange
      mockPrismaService.book.findUnique.mockResolvedValue(mockBook);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.reservation.findFirst.mockResolvedValue(null);

      const activeLoan = {
        id: 1,
        userId: 1,
        bookId: 1,
        status: 'ACTIVE',
      };

      mockPrismaService.loan.findFirst.mockResolvedValue(activeLoan);

      // Act & Assert
      try {
        await service.create(createReservationDto);
        fail('Deveria ter lançado ConflictException');
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toMatch(/empréstimo ativo/);
      }
    });
  });

  describe('cancel', () => {
    const mockReservation = {
      id: 1,
      userId: 1,
      bookId: 1,
      reservationDate: new Date(),
      status: 'PENDING',
      user: { id: 1, name: 'João Silva' },
      book: { id: 1, title: 'Clean Code' },
    };

    it('deve cancelar reserva PENDING com sucesso', async () => {
      // Arrange
      mockPrismaService.reservation.findUnique.mockResolvedValue(
        mockReservation,
      );

      const updatedReservation = {
        ...mockReservation,
        status: 'CANCELLED',
      };

      mockPrismaService.reservation.update.mockResolvedValue(
        updatedReservation,
      );

      // Act
      const result = await service.cancel(1);

      // Assert
      expect(result.message).toContain('cancelada com sucesso');
      expect(result.reservation.status).toBe('CANCELLED');
    });

    it('deve cancelar reserva CONFIRMED com sucesso', async () => {
      // Arrange
      mockPrismaService.reservation.findUnique.mockResolvedValue({
        ...mockReservation,
        status: 'CONFIRMED',
      });

      const updatedReservation = {
        ...mockReservation,
        status: 'CANCELLED',
      };

      mockPrismaService.reservation.update.mockResolvedValue(
        updatedReservation,
      );

      // Act
      const result = await service.cancel(1);

      // Assert
      expect(result.reservation.status).toBe('CANCELLED');
    });

    it('deve lançar NotFoundException quando reserva não existe', async () => {
      // Arrange
      mockPrismaService.reservation.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.cancel(999)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando reserva já foi cancelada', async () => {
      // Arrange
      mockPrismaService.reservation.findUnique.mockResolvedValue({
        ...mockReservation,
        status: 'CANCELLED',
      });

      // Act & Assert
      try {
        await service.cancel(1);
        fail('Deveria ter lançado BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain('já foi cancelada');
      }
    });

    it('deve lançar BadRequestException quando reserva já foi atendida', async () => {
      // Arrange
      mockPrismaService.reservation.findUnique.mockResolvedValue({
        ...mockReservation,
        status: 'FULFILLED',
      });

      // Act & Assert
      try {
        await service.cancel(1);
        fail('Deveria ter lançado BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain('Não é possível cancelar');
      }
    });
  });

  describe('confirmReservation', () => {
    it('deve confirmar a reserva mais antiga (FIFO)', async () => {
      // Arrange
      const oldestReservation = {
        id: 1,
        userId: 1,
        bookId: 1,
        reservationDate: new Date('2026-01-01'),
        status: 'PENDING',
        user: { id: 1, name: 'João Silva' },
        book: { id: 1, title: 'Clean Code' },
      };

      mockPrismaService.reservation.findFirst.mockResolvedValue(
        oldestReservation,
      );

      const confirmedReservation = {
        ...oldestReservation,
        status: 'CONFIRMED',
      };

      mockPrismaService.reservation.update.mockResolvedValue(
        confirmedReservation,
      );

      // Act
      const result = await service.confirmReservation(1);

      // Assert
      expect(result?.message).toContain('confirmada');
      expect(result?.reservation.status).toBe('CONFIRMED');
      expect(mockPrismaService.reservation.findFirst).toHaveBeenCalledWith({
        where: {
          bookId: 1,
          status: 'PENDING',
        },
        orderBy: {
          reservationDate: 'asc', // FIFO
        },
        include: expect.anything(),
      });
    });

    it('deve retornar null quando não há reservas pendentes', async () => {
      // Arrange
      mockPrismaService.reservation.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.confirmReservation(1);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('fulfill', () => {
    const mockReservation = {
      id: 1,
      userId: 1,
      bookId: 1,
      reservationDate: new Date(),
      status: 'CONFIRMED',
      user: { id: 1, name: 'João Silva' },
      book: { id: 1, title: 'Clean Code' },
    };

    it('deve atender reserva CONFIRMED com sucesso', async () => {
      // Arrange
      mockPrismaService.reservation.findUnique.mockResolvedValue(
        mockReservation,
      );

      const fulfilledReservation = {
        ...mockReservation,
        status: 'FULFILLED',
      };

      mockPrismaService.reservation.update.mockResolvedValue(
        fulfilledReservation,
      );

      // Act
      const result = await service.fulfill(1);

      // Assert
      expect(result.message).toContain('atendida com sucesso');
      expect(result.reservation.status).toBe('FULFILLED');
    });

    it('deve lançar NotFoundException quando reserva não existe', async () => {
      // Arrange
      mockPrismaService.reservation.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.fulfill(999)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando reserva não está CONFIRMED', async () => {
      // Arrange
      mockPrismaService.reservation.findUnique.mockResolvedValue({
        ...mockReservation,
        status: 'PENDING',
      });

      // Act & Assert
      try {
        await service.fulfill(1);
        fail('Deveria ter lançado BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain('confirmadas');
      }
    });
  });

  describe('getBookQueue', () => {
    it('deve retornar fila ordenada com posições', async () => {
      // Arrange
      const mockQueue = [
        {
          id: 1,
          userId: 1,
          bookId: 1,
          reservationDate: new Date('2026-01-01'),
          status: 'PENDING',
          user: { id: 1, name: 'João', email: 'joao@test.com' },
        },
        {
          id: 2,
          userId: 2,
          bookId: 1,
          reservationDate: new Date('2026-01-02'),
          status: 'PENDING',
          user: { id: 2, name: 'Maria', email: 'maria@test.com' },
        },
      ];

      mockPrismaService.reservation.findMany.mockResolvedValue(mockQueue);
      mockPrismaService.book.findUnique.mockResolvedValue({
        id: 1,
        title: 'Clean Code',
        availableCopies: 0,
      });

      // Act
      const result = await service.getBookQueue(1);

      // Assert
      expect(result.queueLength).toBe(2);
      expect(result.queue).toHaveLength(2);
      expect(result.queue[0].position).toBe(1);
      expect(result.queue[1].position).toBe(2);
      expect(mockPrismaService.reservation.findMany).toHaveBeenCalledWith({
        where: {
          bookId: 1,
          status: 'PENDING',
        },
        orderBy: {
          reservationDate: 'asc', // FIFO
        },
        include: expect.anything(),
      });
    });

    it('deve retornar fila vazia quando não há reservas', async () => {
      // Arrange
      mockPrismaService.reservation.findMany.mockResolvedValue([]);
      mockPrismaService.book.findUnique.mockResolvedValue({
        id: 1,
        title: 'Clean Code',
        availableCopies: 0,
      });

      // Act
      const result = await service.getBookQueue(1);

      // Assert
      expect(result.queueLength).toBe(0);
      expect(result.queue).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('deve retornar reservas com paginação', async () => {
      // Arrange
      const mockReservations = [
        {
          id: 1,
          userId: 1,
          bookId: 1,
          status: 'PENDING',
          user: { id: 1, name: 'João', email: 'joao@test.com' },
          book: { id: 1, title: 'Clean Code', isbn: '123' },
        },
      ];

      mockPrismaService.reservation.findMany.mockResolvedValue(
        mockReservations,
      );
      mockPrismaService.reservation.count.mockResolvedValue(1);

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

    it('deve filtrar reservas por userId', async () => {
      // Arrange
      mockPrismaService.reservation.findMany.mockResolvedValue([]);
      mockPrismaService.reservation.count.mockResolvedValue(0);

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
      expect(mockPrismaService.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 1 }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar reserva por ID', async () => {
      // Arrange
      const mockReservation = {
        id: 1,
        userId: 1,
        bookId: 1,
        status: 'PENDING',
        user: { id: 1, name: 'João', email: 'joao@test.com', role: 'MEMBER' },
        book: {
          id: 1,
          title: 'Clean Code',
          isbn: '123',
          description: 'Test',
        },
      };

      mockPrismaService.reservation.findUnique.mockResolvedValue(
        mockReservation,
      );

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it('deve lançar NotFoundException quando reserva não existe', async () => {
      // Arrange
      mockPrismaService.reservation.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
