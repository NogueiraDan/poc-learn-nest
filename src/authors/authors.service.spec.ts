import { Test, TestingModule } from '@nestjs/testing';
import { AuthorsService } from './authors.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CreateAuthorDto, UpdateAuthorDto } from './dto';

/**
 * Testes Unitários do AuthorsService
 *
 * Cobertura:
 * - CRUD completo (Create, Read, Update, Delete)
 * - Busca com filtros avançados
 * - Paginação
 * - Contagem de livros por autor
 * - Tratamento de erros
 */
describe('AuthorsService', () => {
  let service: AuthorsService;
  let prismaService: PrismaService;

  // Mock do PrismaService
  const mockPrismaService = {
    author: {
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
        AuthorsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthorsService>(AuthorsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createAuthorDto: CreateAuthorDto = {
      name: 'Robert C. Martin',
      biography:
        'Robert Cecil Martin, conhecido como Uncle Bob, é um engenheiro de software e autor.',
      birthDate: '1952-12-05',
      nationality: 'Americana',
    };

    const mockCreatedAuthor = {
      id: 1,
      ...createAuthorDto,
      createdAt: new Date(),
    };

    it('deve criar autor com sucesso', async () => {
      // Arrange
      mockPrismaService.author.create.mockResolvedValue(mockCreatedAuthor);

      // Act
      const result = await service.create(createAuthorDto);

      // Assert
      expect(result).toEqual(mockCreatedAuthor);
      expect(mockPrismaService.author.create).toHaveBeenCalledWith({
        data: createAuthorDto,
      });
    });
  });

  describe('findAll', () => {
    const mockAuthors = [
      {
        id: 1,
        name: 'Robert C. Martin',
        biography: 'Uncle Bob',
        birthDate: '1952-12-05',
        nationality: 'Americana',
        _count: {
          books: 5, // Contagem de livros
        },
      },
      {
        id: 2,
        name: 'Martin Fowler',
        biography: 'Chief Scientist at ThoughtWorks',
        birthDate: '1963-12-18',
        nationality: 'Britânica',
        _count: {
          books: 3,
        },
      },
    ];

    it('deve retornar todos os autores com contagem de livros', async () => {
      // Arrange
      mockPrismaService.author.findMany.mockResolvedValue(mockAuthors);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(mockAuthors);
      expect(result).toHaveLength(2);
      expect(result[0]._count.books).toBe(5);
      expect(result[1]._count.books).toBe(3);
      expect(mockPrismaService.author.findMany).toHaveBeenCalledWith({
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

    it('deve retornar array vazio quando não há autores', async () => {
      // Arrange
      mockPrismaService.author.findMany.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findAllWithFilters', () => {
    it('deve retornar autores com paginação', async () => {
      // Arrange
      const mockAuthors = [
        {
          id: 1,
          name: 'Robert C. Martin',
          _count: { books: 5 },
        },
      ];

      mockPrismaService.author.findMany.mockResolvedValue(mockAuthors);
      mockPrismaService.author.count.mockResolvedValue(1);

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
      const result = await service.findAllWithFilters(query);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('deve filtrar por busca de texto (name ou biography)', async () => {
      // Arrange
      mockPrismaService.author.findMany.mockResolvedValue([]);
      mockPrismaService.author.count.mockResolvedValue(0);

      const query = Object.assign(
        new (class QueryDto {
          search = 'martin';
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
      await service.findAllWithFilters(query);

      // Assert
      expect(mockPrismaService.author.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'martin', mode: 'insensitive' } },
              { biography: { contains: 'martin', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('deve ordenar por campo customizado', async () => {
      // Arrange
      mockPrismaService.author.findMany.mockResolvedValue([]);
      mockPrismaService.author.count.mockResolvedValue(0);

      const query = Object.assign(
        new (class QueryDto {
          sortBy = 'name' as any;
          sortOrder = 'desc' as any;
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
      await service.findAllWithFilters(query);

      // Assert
      expect(mockPrismaService.author.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'desc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    const mockAuthor = {
      id: 1,
      name: 'Robert C. Martin',
      biography: 'Uncle Bob',
      birthDate: '1952-12-05',
      nationality: 'Americana',
      books: [
        {
          book: {
            id: 1,
            title: 'Clean Code',
            isbn: '978-0132350884',
            publicationYear: 2008,
          },
        },
        {
          book: {
            id: 2,
            title: 'Clean Architecture',
            isbn: '978-0134494166',
            publicationYear: 2017,
          },
        },
      ],
    };

    it('deve retornar autor por ID com seus livros', async () => {
      // Arrange
      mockPrismaService.author.findUnique.mockResolvedValue(mockAuthor);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(result).toEqual(mockAuthor);
      expect(result.books).toHaveLength(2);
      expect(mockPrismaService.author.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          books: {
            include: {
              book: {
                select: {
                  id: true,
                  title: true,
                  isbn: true,
                  publicationYear: true,
                },
              },
            },
          },
        },
      });
    });

    it('deve lançar NotFoundException quando autor não existe', async () => {
      // Arrange
      mockPrismaService.author.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Autor com ID 999 não encontrado',
      );
    });
  });

  describe('update', () => {
    const updateAuthorDto: UpdateAuthorDto = {
      name: 'Robert Cecil Martin',
      biography: 'Uncle Bob - Updated bio',
    };

    const mockAuthor = {
      id: 1,
      name: 'Robert C. Martin',
      biography: 'Uncle Bob',
      birthDate: '1952-12-05',
      nationality: 'Americana',
      books: [],
    };

    const mockUpdatedAuthor = {
      ...mockAuthor,
      ...updateAuthorDto,
    };

    it('deve atualizar autor com sucesso', async () => {
      // Arrange
      mockPrismaService.author.findUnique.mockResolvedValue(mockAuthor);
      mockPrismaService.author.update.mockResolvedValue(mockUpdatedAuthor);

      // Act
      const result = await service.update(1, updateAuthorDto);

      // Assert
      expect(result).toEqual(mockUpdatedAuthor);
      expect(mockPrismaService.author.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateAuthorDto,
      });
    });

    it('deve lançar NotFoundException quando autor não existe', async () => {
      // Arrange
      mockPrismaService.author.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(999, updateAuthorDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    const mockAuthor = {
      id: 1,
      name: 'Robert C. Martin',
      biography: 'Uncle Bob',
      books: [],
    };

    it('deve remover autor com sucesso', async () => {
      // Arrange
      mockPrismaService.author.findUnique.mockResolvedValue(mockAuthor);
      mockPrismaService.author.delete.mockResolvedValue(mockAuthor);

      // Act
      const result = await service.remove(1);

      // Assert
      expect(result).toEqual(mockAuthor);
      expect(mockPrismaService.author.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('deve lançar NotFoundException quando autor não existe', async () => {
      // Arrange
      mockPrismaService.author.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
