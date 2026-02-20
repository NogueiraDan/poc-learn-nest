/**
 * Testes Unitários - BooksController
 *
 * Cobertura:
 * - POST /books - Criar livro
 * - GET /books - Listar livros (com/sem filtros)
 * - GET /books/:id - Buscar livro por ID
 * - PATCH /books/:id - Atualizar livro
 * - DELETE /books/:id - Remover livro
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';

describe('BooksController', () => {
  let controller: BooksController;
  let booksService: BooksService;

  const mockBooksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllWithFilters: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [
        {
          provide: BooksService,
          useValue: mockBooksService,
        },
      ],
    }).compile();

    controller = module.get<BooksController>(BooksController);
    booksService = module.get<BooksService>(BooksService);

    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('deve criar um novo livro', async () => {
      const createDto = {
        title: 'Clean Code',
        isbn: '978-0132350884',
        publicationYear: 2008,
        totalCopies: 5,
        categoryId: 1,
        authorIds: [1, 2],
      };

      const mockBook = {
        id: 1,
        ...createDto,
        availableCopies: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBooksService.create.mockResolvedValue(mockBook);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockBook);
      expect(mockBooksService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll()', () => {
    it('deve listar todos os livros quando não há query params', async () => {
      const mockBooks = [
        {
          id: 1,
          title: 'Clean Code',
          isbn: '978-0132350884',
        },
      ];

      mockBooksService.findAll.mockResolvedValue(mockBooks);

      const result = await controller.findAll({});

      expect(result).toEqual(mockBooks);
      expect(mockBooksService.findAll).toHaveBeenCalled();
      expect(mockBooksService.findAllWithFilters).not.toHaveBeenCalled();
    });

    it('deve usar findAllWithFilters quando há query params', async () => {
      const query = {
        search: 'clean',
        page: 1,
        limit: 10,
      };

      const mockPaginatedBooks = {
        data: [{ id: 1, title: 'Clean Code' }],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockBooksService.findAllWithFilters.mockResolvedValue(mockPaginatedBooks);

      const result = await controller.findAll(query);

      expect(result).toEqual(mockPaginatedBooks);
      expect(mockBooksService.findAllWithFilters).toHaveBeenCalledWith(query);
      expect(mockBooksService.findAll).not.toHaveBeenCalled();
    });
  });

  describe('findOne()', () => {
    it('deve buscar um livro por ID', async () => {
      const mockBook = {
        id: 1,
        title: 'Clean Code',
        isbn: '978-0132350884',
        category: { id: 1, name: 'Programação' },
        authors: [{ id: 1, name: 'Robert Martin' }],
      };

      mockBooksService.findOne.mockResolvedValue(mockBook);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockBook);
      expect(mockBooksService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update()', () => {
    it('deve atualizar um livro', async () => {
      const updateDto = {
        title: 'Clean Code - Edição Atualizada',
        totalCopies: 10,
      };

      const mockUpdatedBook = {
        id: 1,
        title: 'Clean Code - Edição Atualizada',
        totalCopies: 10,
      };

      mockBooksService.update.mockResolvedValue(mockUpdatedBook);

      const result = await controller.update(1, updateDto);

      expect(result).toEqual(mockUpdatedBook);
      expect(mockBooksService.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('remove()', () => {
    it('deve remover um livro', async () => {
      const mockDeletedBook = {
        id: 1,
        title: 'Clean Code',
      };

      mockBooksService.remove.mockResolvedValue(mockDeletedBook);

      const result = await controller.remove(1);

      expect(result).toEqual(mockDeletedBook);
      expect(mockBooksService.remove).toHaveBeenCalledWith(1);
    });
  });
});
