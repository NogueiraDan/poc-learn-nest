/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Testes Unitários - AuthorsController
 *
 * Cobertura:
 * - POST /authors - Criar autor
 * - GET /authors - Listar autores (com/sem filtros)
 * - GET /authors/:id - Buscar autor por ID
 * - PATCH /authors/:id - Atualizar autor
 * - DELETE /authors/:id - Remover autor
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthorsController } from './authors.controller';
import { AuthorsService } from './authors.service';

describe('AuthorsController', () => {
  let controller: AuthorsController;
  let authorsService: AuthorsService;

  const mockAuthorsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllWithFilters: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthorsController],
      providers: [
        {
          provide: AuthorsService,
          useValue: mockAuthorsService,
        },
      ],
    }).compile();

    controller = module.get<AuthorsController>(AuthorsController);
    authorsService = module.get<AuthorsService>(AuthorsService);

    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('deve criar um novo autor', async () => {
      const createDto = {
        name: 'Robert Martin',
        biography: 'Autor de Clean Code',
        birthDate: new Date('1952-12-05'),
        nationality: 'Americano',
      };

      const mockAuthor = {
        id: 1,
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthorsService.create.mockResolvedValue(mockAuthor);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockAuthor);
      expect(mockAuthorsService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll()', () => {
    it('deve listar todos os autores quando não há query params', async () => {
      const mockAuthors = [
        {
          id: 1,
          name: 'Robert Martin',
          _count: { books: 5 },
        },
      ];

      mockAuthorsService.findAll.mockResolvedValue(mockAuthors);

      const result = await controller.findAll({});

      expect(result).toEqual(mockAuthors);
      expect(mockAuthorsService.findAll).toHaveBeenCalled();
      expect(mockAuthorsService.findAllWithFilters).not.toHaveBeenCalled();
    });

    it('deve usar findAllWithFilters quando há query params', async () => {
      const query = {
        search: 'martin',
        page: 1,
        limit: 10,
      };

      const mockPaginatedAuthors = {
        data: [{ id: 1, name: 'Robert Martin' }],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockAuthorsService.findAllWithFilters.mockResolvedValue(
        mockPaginatedAuthors,
      );

      const result = await controller.findAll(query);

      expect(result).toEqual(mockPaginatedAuthors);
      expect(mockAuthorsService.findAllWithFilters).toHaveBeenCalledWith(query);
      expect(mockAuthorsService.findAll).not.toHaveBeenCalled();
    });
  });

  describe('findOne()', () => {
    it('deve buscar um autor por ID', async () => {
      const mockAuthor = {
        id: 1,
        name: 'Robert Martin',
        biography: 'Autor de Clean Code',
        books: [
          { id: 1, title: 'Clean Code' },
          { id: 2, title: 'Clean Architecture' },
        ],
      };

      mockAuthorsService.findOne.mockResolvedValue(mockAuthor);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockAuthor);
      expect(mockAuthorsService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update()', () => {
    it('deve atualizar um autor', async () => {
      const updateDto = {
        biography: 'Biografia atualizada',
      };

      const mockUpdatedAuthor = {
        id: 1,
        name: 'Robert Martin',
        biography: 'Biografia atualizada',
      };

      mockAuthorsService.update.mockResolvedValue(mockUpdatedAuthor);

      const result = await controller.update(1, updateDto);

      expect(result).toEqual(mockUpdatedAuthor);
      expect(mockAuthorsService.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('remove()', () => {
    it('deve remover um autor', async () => {
      const mockDeletedAuthor = {
        id: 1,
        name: 'Robert Martin',
      };

      mockAuthorsService.remove.mockResolvedValue(mockDeletedAuthor);

      const result = await controller.remove(1);

      expect(result).toEqual(mockDeletedAuthor);
      expect(mockAuthorsService.remove).toHaveBeenCalledWith(1);
    });
  });
});
