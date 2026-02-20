/**
 * Testes Unitários - CategoriesService
 *
 * Cobertura:
 * - create(): Criar nova categoria
 * - findAll(): Listar categorias com contagem de livros
 * - findAllWithFilters(): Listar com filtros e paginação
 * - findOne(): Buscar categoria por ID com livros
 * - update(): Atualizar categoria
 * - remove(): Deletar categoria (com validação de livros vinculados)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    category: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Limpar mocks antes de cada teste
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

      mockPrismaService.category.create.mockResolvedValue(mockCategory);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCategory);
      expect(mockPrismaService.category.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });
  });

  describe('findAll()', () => {
    it('deve retornar todas as categorias com contagem de livros', async () => {
      const mockCategories = [
        {
          id: 1,
          name: 'Programação',
          description: 'Livros sobre programação',
          _count: { books: 5 },
        },
        {
          id: 2,
          name: 'Ficção',
          description: 'Livros de ficção',
          _count: { books: 10 },
        },
      ];

      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.findAll();

      expect(result).toEqual(mockCategories);
      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: { books: true },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    });

    it('deve retornar array vazio quando não há categorias', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findAllWithFilters()', () => {
    it('deve retornar categorias paginadas', async () => {
      const query = {
        page: 1,
        limit: 10,
        getSkip: () => 0,
        getTake: () => 10,
      };

      const mockCategories = [
        {
          id: 1,
          name: 'Programação',
          description: 'Livros sobre programação',
          _count: { books: 5 },
        },
      ];

      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);
      mockPrismaService.category.count.mockResolvedValue(1);

      const result = await service.findAllWithFilters(query as any);

      expect(result.data).toEqual(mockCategories);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('deve filtrar por texto de busca', async () => {
      const query = {
        search: 'programação',
        page: 1,
        limit: 10,
        getSkip: () => 0,
        getTake: () => 10,
      };

      mockPrismaService.category.findMany.mockResolvedValue([]);
      mockPrismaService.category.count.mockResolvedValue(0);

      await service.findAllWithFilters(query as any);

      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'programação', mode: 'insensitive' } },
              { description: { contains: 'programação', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('deve aplicar ordenação customizada', async () => {
      const query = {
        sortBy: 'name',
        sortOrder: 'desc' as const,
        page: 1,
        limit: 10,
        getSkip: () => 0,
        getTake: () => 10,
      };

      mockPrismaService.category.findMany.mockResolvedValue([]);
      mockPrismaService.category.count.mockResolvedValue(0);

      await service.findAllWithFilters(query as any);

      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            name: 'desc',
          },
        }),
      );
    });
  });

  describe('findOne()', () => {
    it('deve retornar uma categoria com seus livros', async () => {
      const mockCategory = {
        id: 1,
        name: 'Programação',
        description: 'Livros sobre programação',
        books: [
          {
            id: 1,
            title: 'Clean Code',
            isbn: '978-0132350884',
            availableCopies: 3,
          },
        ],
      };

      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

      const result = await service.findOne(1);

      expect(result).toEqual(mockCategory);
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          books: {
            select: {
              id: true,
              title: true,
              isbn: true,
              availableCopies: true,
            },
          },
        },
      });
    });

    it('deve lançar NotFoundException quando categoria não existe', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Categoria com ID 999 não encontrada',
      );
    });
  });

  describe('update()', () => {
    it('deve atualizar uma categoria existente', async () => {
      const updateDto = {
        name: 'Programação Atualizada',
        description: 'Nova descrição',
      };

      const mockCategory = {
        id: 1,
        name: 'Programação',
        description: 'Descrição antiga',
        books: [],
      };

      const mockUpdatedCategory = {
        id: 1,
        ...updateDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.category.update.mockResolvedValue(mockUpdatedCategory);

      const result = await service.update(1, updateDto);

      expect(result).toEqual(mockUpdatedCategory);
      expect(mockPrismaService.category.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
      });
    });

    it('deve lançar NotFoundException quando categoria não existe', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { name: 'Teste' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove()', () => {
    it('deve deletar uma categoria sem livros vinculados', async () => {
      const mockCategory = {
        id: 1,
        name: 'Programação',
        description: 'Livros sobre programação',
        books: [], // Sem livros vinculados
      };

      const mockDeleted = {
        id: 1,
        name: 'Programação',
        description: 'Livros sobre programação',
      };

      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.category.delete.mockResolvedValue(mockDeleted);

      const result = await service.remove(1);

      expect(result).toEqual(mockDeleted);
      expect(mockPrismaService.category.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('deve lançar erro quando categoria tem livros vinculados', async () => {
      const mockCategory = {
        id: 1,
        name: 'Programação',
        description: 'Livros sobre programação',
        books: [
          { id: 1, title: 'Clean Code' },
          { id: 2, title: 'Clean Architecture' },
        ],
      };

      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

      await expect(service.remove(1)).rejects.toThrow(
        'Não é possível deletar a categoria "Programação" pois existem 2 livro(s) vinculado(s)',
      );

      expect(mockPrismaService.category.delete).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando categoria não existe', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.category.delete).not.toHaveBeenCalled();
    });
  });
});
