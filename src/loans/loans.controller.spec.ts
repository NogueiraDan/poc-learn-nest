/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Testes Unitários - LoansController
 *
 * Cobertura:
 * - POST /loans - Criar empréstimo
 * - GET /loans - Listar empréstimos com filtros
 * - GET /loans/:id - Buscar empréstimo por ID
 * - PATCH /loans/:id/return - Devolver livro
 * - PATCH /loans/:id/renew - Renovar empréstimo
 * - GET /loans/user/:userId/stats - Estatísticas do usuário
 */

import { Test, TestingModule } from '@nestjs/testing';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';

describe('LoansController', () => {
  let controller: LoansController;
  let loansService: LoansService;

  const mockLoansService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    returnBook: jest.fn(),
    renewLoan: jest.fn(),
    getUserLoanStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoansController],
      providers: [
        {
          provide: LoansService,
          useValue: mockLoansService,
        },
      ],
    }).compile();

    controller = module.get<LoansController>(LoansController);
    loansService = module.get<LoansService>(LoansService);

    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('deve criar um novo empréstimo', async () => {
      const createDto = {
        userId: 1,
        bookId: 3,
        dueDate: new Date('2026-03-15'),
      };

      const mockLoan = {
        id: 1,
        userId: 1,
        bookId: 3,
        loanDate: new Date(),
        dueDate: new Date('2026-03-15'),
        status: 'ACTIVE',
      };

      mockLoansService.create.mockResolvedValue(mockLoan);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockLoan);
      expect(mockLoansService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll()', () => {
    it('deve listar empréstimos com filtros', async () => {
      const query = {
        userId: 1,
        status: 'ACTIVE',
        page: 1,
        limit: 10,
      };

      const mockPaginatedLoans = {
        data: [
          {
            id: 1,
            userId: 1,
            bookId: 3,
            status: 'ACTIVE',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockLoansService.findAll.mockResolvedValue(mockPaginatedLoans);

      const result = await controller.findAll(query as any);

      expect(result).toEqual(mockPaginatedLoans);
      expect(mockLoansService.findAll).toHaveBeenCalledWith(query);
    });

    it('deve listar todos os empréstimos sem filtros', async () => {
      const query = {};

      const mockPaginatedLoans = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      mockLoansService.findAll.mockResolvedValue(mockPaginatedLoans);

      const result = await controller.findAll(query as any);

      expect(result).toEqual(mockPaginatedLoans);
      expect(mockLoansService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne()', () => {
    it('deve buscar um empréstimo por ID', async () => {
      const mockLoan = {
        id: 1,
        userId: 1,
        bookId: 3,
        loanDate: new Date(),
        dueDate: new Date('2026-03-15'),
        status: 'ACTIVE',
        user: {
          id: 1,
          name: 'João Silva',
          email: 'joao@example.com',
        },
        book: {
          id: 3,
          title: 'Clean Code',
          isbn: '978-0132350884',
        },
      };

      mockLoansService.findOne.mockResolvedValue(mockLoan);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockLoan);
      expect(mockLoansService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('getUserStats()', () => {
    it('deve retornar estatísticas de empréstimos do usuário', async () => {
      const mockStats = {
        userId: 1,
        totalLoans: 10,
        activeLoans: 2,
        returnedLoans: 7,
        overdueLoans: 1,
        totalFines: 20.0,
        pendingFines: 10.0,
      };

      mockLoansService.getUserLoanStats.mockResolvedValue(mockStats);

      const result = await controller.getUserStats(1);

      expect(result).toEqual(mockStats);
      expect(mockLoansService.getUserLoanStats).toHaveBeenCalledWith(1);
    });
  });

  describe('returnBook()', () => {
    it('deve devolver um livro', async () => {
      const returnDto = {
        returnDate: new Date('2026-03-10'),
      };

      const mockReturnedLoan = {
        id: 1,
        userId: 1,
        bookId: 3,
        status: 'RETURNED',
        returnDate: new Date('2026-03-10'),
      };

      mockLoansService.returnBook.mockResolvedValue(mockReturnedLoan);

      const result = await controller.returnBook(1, returnDto);

      expect(result).toEqual(mockReturnedLoan);
      expect(mockLoansService.returnBook).toHaveBeenCalledWith(1, returnDto);
    });

    it('deve devolver um livro sem especificar data (usa data atual)', async () => {
      const returnDto = {};

      const mockReturnedLoan = {
        id: 1,
        status: 'RETURNED',
        returnDate: expect.any(Date),
      };

      mockLoansService.returnBook.mockResolvedValue(mockReturnedLoan);

      const result = await controller.returnBook(1, returnDto);

      expect(mockLoansService.returnBook).toHaveBeenCalledWith(1, returnDto);
    });
  });

  describe('renewLoan()', () => {
    it('deve renovar um empréstimo', async () => {
      const renewDto = {
        additionalDays: 14,
      };

      const mockRenewedLoan = {
        id: 1,
        userId: 1,
        bookId: 3,
        dueDate: new Date('2026-03-29'),
        renewalCount: 1,
      };

      mockLoansService.renewLoan.mockResolvedValue(mockRenewedLoan);

      const result = await controller.renewLoan(1, renewDto);

      expect(result).toEqual(mockRenewedLoan);
      expect(mockLoansService.renewLoan).toHaveBeenCalledWith(1, renewDto);
    });

    it('deve renovar com período padrão (sem especificar dias)', async () => {
      const renewDto = {};

      const mockRenewedLoan = {
        id: 1,
        dueDate: new Date('2026-03-29'),
        renewalCount: 1,
      };

      mockLoansService.renewLoan.mockResolvedValue(mockRenewedLoan);

      const result = await controller.renewLoan(1, renewDto);

      expect(mockLoansService.renewLoan).toHaveBeenCalledWith(1, renewDto);
    });
  });
});
