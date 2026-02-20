import { Test, TestingModule } from '@nestjs/testing';
import { BooksService } from './books.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CreateBookDto, UpdateBookDto } from './dto';

/**
 * Testes Unitários do BooksService
 *
 * Cobertura:
 * - CRUD completo (Create, Read, Update, Delete)
 * - Busca com filtros avançados
 * - Paginação
 * - Busca por ISBN
 * - Tratamento de erros
 */
describe('BooksService', () => {
  let service: BooksService;
  let prismaService: PrismaService;

  // Mock do PrismaService
  const mockPrismaService = {
    book: {
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
        BooksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createBookDto: CreateBookDto = {
      title: 'Clean Code',
      isbn: '978-0132350884',
      description: 'A Handbook of Agile Software Craftsmanship',
      publicationYear: 2008,
      totalCopies: 5,
      categoryId: 1,
    };

    const mockCreatedBook = {
      id: 1,
      ...createBookDto,
      availableCopies: 5,
      createdAt: new Date(),
      category: {
        id: 1,
        name: 'Tecnologia',
        description: 'Livros de tecnologia',
      },
    };

    it('deve criar livro com sucesso', async () => {
      // Arrange
      mockPrismaService.book.create.mockResolvedValue(mockCreatedBook);

      // Act
      const result = await service.create(createBookDto);

      // Assert
      expect(result).toEqual(mockCreatedBook);
      expect(mockPrismaService.book.create).toHaveBeenCalledWith({
        data: {
          title: createBookDto.title,
          isbn: createBookDto.isbn,
          description: createBookDto.description,
          publicationYear: createBookDto.publicationYear,
          totalCopies: createBookDto.totalCopies,
          availableCopies: createBookDto.totalCopies, // Inicialmente iguais
          categoryId: createBookDto.categoryId,
        },
        include: {
          category: true,
        },
      });
    });

    it('deve inicializar availableCopies igual a totalCopies', async () => {
      // Arrange
      mockPrismaService.book.create.mockResolvedValue(mockCreatedBook);

      // Act
      const result = await service.create(createBookDto);

      // Assert
      expect(result.availableCopies).toBe(result.totalCopies);
    });
  });

  describe('findAll', () => {
    const mockBooks = [
      {
        id: 1,
        title: 'Clean Code',
        isbn: '978-0132350884',
        availableCopies: 5,
        category: { id: 1, name: 'Tecnologia' },
        authors: [
          {
            author: { id: 1, name: 'Robert C. Martin' },
          },
        ],
      },
      {
        id: 2,
        title: 'Clean Architecture',
        isbn: '978-0134494166',
        availableCopies: 3,
        category: { id: 1, name: 'Tecnologia' },
        authors: [
          {
            author: { id: 1, name: 'Robert C. Martin' },
          },
        ],
      },
    ];

    it('deve retornar todos os livros com relacionamentos', async () => {
      // Arrange
      mockPrismaService.book.findMany.mockResolvedValue(mockBooks);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(mockBooks);
      expect(result).toHaveLength(2);
      expect(mockPrismaService.book.findMany).toHaveBeenCalledWith({
        include: {
          category: true,
          authors: {
            include: {
              author: true,
            },
          },
        },
        orderBy: {
          title: 'asc',
        },
      });
    });

    it('deve retornar array vazio quando não há livros', async () => {
      // Arrange
      mockPrismaService.book.findMany.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findAllWithFilters', () => {
    it('deve retornar livros com paginação', async () => {
      // Arrange
      const mockBooks = [
        {
          id: 1,
          title: 'Clean Code',
          category: { id: 1, name: 'Tecnologia' },
          authors: [],
        },
      ];

      mockPrismaService.book.findMany.mockResolvedValue(mockBooks);
      mockPrismaService.book.count.mockResolvedValue(1);

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

    it('deve filtrar por busca de texto', async () => {
      // Arrange
      mockPrismaService.book.findMany.mockResolvedValue([]);
      mockPrismaService.book.count.mockResolvedValue(0);

      const query = Object.assign(
        new (class QueryDto {
          search = 'clean';
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
      expect(mockPrismaService.book.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { title: { contains: 'clean', mode: 'insensitive' } },
              { isbn: { contains: 'clean', mode: 'insensitive' } },
              { description: { contains: 'clean', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('deve filtrar por categoryId', async () => {
      // Arrange
      mockPrismaService.book.findMany.mockResolvedValue([]);
      mockPrismaService.book.count.mockResolvedValue(0);

      const query = Object.assign(
        new (class QueryDto {
          categoryId = 1;
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
      expect(mockPrismaService.book.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: 1 }),
        }),
      );
    });

    it('deve filtrar por authorId', async () => {
      // Arrange
      mockPrismaService.book.findMany.mockResolvedValue([]);
      mockPrismaService.book.count.mockResolvedValue(0);

      const query = Object.assign(
        new (class QueryDto {
          authorId = 1;
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
      expect(mockPrismaService.book.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            authors: {
              some: {
                authorId: 1,
              },
            },
          }),
        }),
      );
    });

    it('deve filtrar por ano de publicação (yearFrom/yearTo)', async () => {
      // Arrange
      mockPrismaService.book.findMany.mockResolvedValue([]);
      mockPrismaService.book.count.mockResolvedValue(0);

      const query = Object.assign(
        new (class QueryDto {
          yearFrom = 2000;
          yearTo = 2020;
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
      expect(mockPrismaService.book.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            publicationYear: {
              gte: 2000,
              lte: 2020,
            },
          }),
        }),
      );
    });

    it('deve filtrar apenas livros disponíveis', async () => {
      // Arrange
      mockPrismaService.book.findMany.mockResolvedValue([]);
      mockPrismaService.book.count.mockResolvedValue(0);

      const query = Object.assign(
        new (class QueryDto {
          available = true;
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
      expect(mockPrismaService.book.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            availableCopies: { gt: 0 },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    const mockBook = {
      id: 1,
      title: 'Clean Code',
      isbn: '978-0132350884',
      description: 'A Handbook of Agile Software Craftsmanship',
      publicationYear: 2008,
      totalCopies: 5,
      availableCopies: 5,
      category: { id: 1, name: 'Tecnologia' },
      authors: [
        {
          author: { id: 1, name: 'Robert C. Martin' },
        },
      ],
    };

    it('deve retornar livro por ID', async () => {
      // Arrange
      mockPrismaService.book.findUnique.mockResolvedValue(mockBook);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(result).toEqual(mockBook);
      expect(mockPrismaService.book.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          category: true,
          authors: {
            include: {
              author: true,
            },
          },
        },
      });
    });

    it('deve lançar NotFoundException quando livro não existe', async () => {
      // Arrange
      mockPrismaService.book.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Livro com ID 999 não encontrado',
      );
    });
  });

  describe('update', () => {
    const updateBookDto: UpdateBookDto = {
      title: 'Clean Code - 2nd Edition',
      description: 'Updated description',
    };

    const mockBook = {
      id: 1,
      title: 'Clean Code',
      isbn: '978-0132350884',
      category: { id: 1, name: 'Tecnologia' },
      authors: [],
    };

    const mockUpdatedBook = {
      ...mockBook,
      ...updateBookDto,
    };

    it('deve atualizar livro com sucesso', async () => {
      // Arrange
      mockPrismaService.book.findUnique.mockResolvedValue(mockBook);
      mockPrismaService.book.update.mockResolvedValue(mockUpdatedBook);

      // Act
      const result = await service.update(1, updateBookDto);

      // Assert
      expect(result).toEqual(mockUpdatedBook);
      expect(mockPrismaService.book.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateBookDto,
        include: {
          category: true,
          authors: {
            include: {
              author: true,
            },
          },
        },
      });
    });

    it('deve lançar NotFoundException quando livro não existe', async () => {
      // Arrange
      mockPrismaService.book.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(999, updateBookDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    const mockBook = {
      id: 1,
      title: 'Clean Code',
      isbn: '978-0132350884',
    };

    it('deve remover livro com sucesso', async () => {
      // Arrange
      mockPrismaService.book.findUnique.mockResolvedValue(mockBook);
      mockPrismaService.book.delete.mockResolvedValue(mockBook);

      // Act
      const result = await service.remove(1);

      // Assert
      expect(result).toEqual(mockBook);
      expect(mockPrismaService.book.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('deve lançar NotFoundException quando livro não existe', async () => {
      // Arrange
      mockPrismaService.book.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByIsbn', () => {
    const mockBook = {
      id: 1,
      title: 'Clean Code',
      isbn: '978-0132350884',
      category: { id: 1, name: 'Tecnologia' },
      authors: [],
    };

    it('deve retornar livro por ISBN', async () => {
      // Arrange
      mockPrismaService.book.findUnique.mockResolvedValue(mockBook);

      // Act
      const result = await service.findByIsbn('978-0132350884');

      // Assert
      expect(result).toEqual(mockBook);
      expect(mockPrismaService.book.findUnique).toHaveBeenCalledWith({
        where: { isbn: '978-0132350884' },
        include: {
          category: true,
          authors: {
            include: {
              author: true,
            },
          },
        },
      });
    });

    it('deve retornar null quando ISBN não existe', async () => {
      // Arrange
      mockPrismaService.book.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.findByIsbn('invalid-isbn');

      // Assert
      expect(result).toBeNull();
    });
  });
});
