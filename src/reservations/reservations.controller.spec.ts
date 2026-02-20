/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Testes Unitários - ReservationsController
 *
 * Cobertura:
 * - POST /reservations - Criar reserva
 * - GET /reservations - Listar reservas com filtros
 * - GET /reservations/:id - Buscar reserva por ID
 * - PATCH /reservations/:id/cancel - Cancelar reserva
 * - PATCH /reservations/:id/fulfill - Marcar como atendida
 * - GET /reservations/book/:bookId/queue - Fila de espera do livro
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

describe('ReservationsController', () => {
  let controller: ReservationsController;
  let reservationsService: ReservationsService;

  const mockReservationsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    cancel: jest.fn(),
    fulfill: jest.fn(),
    getBookQueue: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationsController],
      providers: [
        {
          provide: ReservationsService,
          useValue: mockReservationsService,
        },
      ],
    }).compile();

    controller = module.get<ReservationsController>(ReservationsController);
    reservationsService = module.get<ReservationsService>(ReservationsService);

    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('deve criar uma nova reserva', async () => {
      const createDto = {
        userId: 1,
        bookId: 5,
      };

      const mockReservation = {
        id: 1,
        userId: 1,
        bookId: 5,
        status: 'PENDING',
        reservationDate: new Date(),
        position: 1,
      };

      mockReservationsService.create.mockResolvedValue(mockReservation);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockReservation);
      expect(mockReservationsService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll()', () => {
    it('deve listar reservas com filtros', async () => {
      const query = {
        userId: 1,
        status: 'PENDING',
        page: 1,
        limit: 10,
      };

      const mockPaginatedReservations = {
        data: [
          {
            id: 1,
            userId: 1,
            bookId: 5,
            status: 'PENDING',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockReservationsService.findAll.mockResolvedValue(
        mockPaginatedReservations,
      );

      const result = await controller.findAll(query as any);

      expect(result).toEqual(mockPaginatedReservations);
      expect(mockReservationsService.findAll).toHaveBeenCalledWith(query);
    });

    it('deve listar todas as reservas sem filtros', async () => {
      const query = {};

      const mockPaginatedReservations = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      mockReservationsService.findAll.mockResolvedValue(
        mockPaginatedReservations,
      );

      const result = await controller.findAll(query as any);

      expect(result).toEqual(mockPaginatedReservations);
      expect(mockReservationsService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne()', () => {
    it('deve buscar uma reserva por ID', async () => {
      const mockReservation = {
        id: 1,
        userId: 1,
        bookId: 5,
        status: 'PENDING',
        reservationDate: new Date(),
        position: 2,
        user: {
          id: 1,
          name: 'João Silva',
          email: 'joao@example.com',
        },
        book: {
          id: 5,
          title: 'Design Patterns',
          isbn: '978-0201633610',
        },
      };

      mockReservationsService.findOne.mockResolvedValue(mockReservation);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockReservation);
      expect(mockReservationsService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('getBookQueue()', () => {
    it('deve retornar fila de espera de um livro', async () => {
      const mockQueue = {
        book: {
          id: 5,
          title: 'Design Patterns',
          availableCopies: 0,
          totalCopies: 3,
        },
        queueSize: 3,
        queue: [
          {
            id: 1,
            userId: 1,
            position: 1,
            reservationDate: new Date(),
            user: { name: 'João Silva' },
          },
          {
            id: 2,
            userId: 2,
            position: 2,
            reservationDate: new Date(),
            user: { name: 'Maria Santos' },
          },
          {
            id: 3,
            userId: 3,
            position: 3,
            reservationDate: new Date(),
            user: { name: 'Pedro Costa' },
          },
        ],
      };

      mockReservationsService.getBookQueue.mockResolvedValue(mockQueue);

      const result = await controller.getBookQueue(5);

      expect(result).toEqual(mockQueue);
      expect(mockReservationsService.getBookQueue).toHaveBeenCalledWith(5);
    });

    it('deve retornar fila vazia quando não há reservas', async () => {
      const mockQueue = {
        book: {
          id: 5,
          title: 'Design Patterns',
          availableCopies: 3,
          totalCopies: 3,
        },
        queueSize: 0,
        queue: [],
      };

      mockReservationsService.getBookQueue.mockResolvedValue(mockQueue);

      const result = await controller.getBookQueue(5);

      expect(result).toEqual(mockQueue);
      expect(result.queue).toEqual([]);
    });
  });

  describe('cancel()', () => {
    it('deve cancelar uma reserva', async () => {
      const mockCancelledReservation = {
        id: 1,
        userId: 1,
        bookId: 5,
        status: 'CANCELLED',
        cancelledAt: new Date(),
      };

      mockReservationsService.cancel.mockResolvedValue(
        mockCancelledReservation,
      );

      const result = await controller.cancel(1);

      expect(result).toEqual(mockCancelledReservation);
      expect(mockReservationsService.cancel).toHaveBeenCalledWith(1);
    });
  });

  describe('fulfill()', () => {
    it('deve marcar reserva como atendida', async () => {
      const mockFulfilledReservation = {
        id: 1,
        userId: 1,
        bookId: 5,
        status: 'FULFILLED',
        fulfilledAt: new Date(),
      };

      mockReservationsService.fulfill.mockResolvedValue(
        mockFulfilledReservation,
      );

      const result = await controller.fulfill(1);

      expect(result).toEqual(mockFulfilledReservation);
      expect(mockReservationsService.fulfill).toHaveBeenCalledWith(1);
    });
  });
});
