/**
 * Testes Unitários - CategoriesController
 *
 * Cobertura:
 * - POST /categories - Criar categoria
 * - GET /categories - Listar categorias (com/sem filtros)
 * - GET /categories/:id - Buscar categoria por ID
 * - PATCH /categories/:id - Atualizar categoria
 * - DELETE /categories/:id - Remover categoria
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let categoriesService: CategoriesService;

  const mockCategoriesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllWithFilters: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    categoriesService = module.get<CategoriesService>(CategoriesService);

    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('deve criar uma nova categoria', async () => {
      const createDto = {
        name: 'Programação',
        description: 'Livros sobre programação',
      };

      const mockCategory = {
        id: 1,
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCategoriesService.create.mockResolvedValue(mockCategory);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockCategory);
      expect(mockCategoriesService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll()', () => {
    it('deve listar todas as categorias quando não há query params', async () => {
      const mockCategories = [
        {
          id: 1,
          name: 'Programação',
          _count: { books: 10 },
        },
      ];

      mockCategoriesService.findAll.mockResolvedValue(mockCategories);

      const result = await controller.findAll({});

      expect(result).toEqual(mockCategories);
      expect(mockCategoriesService.findAll).toHaveBeenCalled();
      expect(mockCategoriesService.findAllWithFilters).not.toHaveBeenCalled();
    });

    it('deve usar findAllWithFilters quando há query params', async () => {
      const query = {
        search: 'programação',
        page: 1,
        limit: 10,
      };

      const mockPaginatedCategories = {
        data: [{ id: 1, name: 'Programação' }],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockCategoriesService.findAllWithFilters.mockResolvedValue(
        mockPaginatedCategories,
      );

      const result = await controller.findAll(query);

      expect(result).toEqual(mockPaginatedCategories);
      expect(mockCategoriesService.findAllWithFilters).toHaveBeenCalledWith(
        query,
      );
      expect(mockCategoriesService.findAll).not.toHaveBeenCalled();
    });
  });

  describe('findOne()', () => {
    it('deve buscar uma categoria por ID', async () => {
      const mockCategory = {
        id: 1,
        name: 'Programação',
        description: 'Livros sobre programação',
        books: [
          { id: 1, title: 'Clean Code', availableCopies: 3 },
          { id: 2, title: 'Clean Architecture', availableCopies: 2 },
        ],
      };

      mockCategoriesService.findOne.mockResolvedValue(mockCategory);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockCategory);
      expect(mockCategoriesService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update()', () => {
    it('deve atualizar uma categoria', async () => {
      const updateDto = {
        description: 'Descrição atualizada',
      };

      const mockUpdatedCategory = {
        id: 1,
        name: 'Programação',
        description: 'Descrição atualizada',
      };

      mockCategoriesService.update.mockResolvedValue(mockUpdatedCategory);

      const result = await controller.update(1, updateDto);

      expect(result).toEqual(mockUpdatedCategory);
      expect(mockCategoriesService.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('remove()', () => {
    it('deve remover uma categoria', async () => {
      const mockDeletedCategory = {
        id: 1,
        name: 'Programação',
      };

      mockCategoriesService.remove.mockResolvedValue(mockDeletedCategory);

      const result = await controller.remove(1);

      expect(result).toEqual(mockDeletedCategory);
      expect(mockCategoriesService.remove).toHaveBeenCalledWith(1);
    });
  });
});
