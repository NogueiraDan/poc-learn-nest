/**
 * Books Service - Lógica de Negócio com Prisma
 *
 * Conceitos NestJS + Prisma:
 *
 * 1. @Injectable() - Permite injeção de dependência
 * 2. PrismaService - Injetado via constructor para acessar o banco
 * 3. Prisma Client - API type-safe para queries
 * 4. Async/Await - Todas as operações de banco são assíncronas
 *
 * Mudanças da Fase 1 para Fase 2:
 * ✅ Array in-memory → PostgreSQL via Prisma
 * ✅ Métodos síncronos → Métodos assíncronos
 * ✅ Dados temporários → Dados persistidos
 * ✅ Sem relacionamentos → Com relacionamentos (Category, Authors)
 *
 * Prisma Query Features:
 * - findMany() - Buscar múltiplos registros
 * - findUnique() - Buscar por campo único (id, isbn)
 * - create() - Criar registro
 * - update() - Atualizar registro
 * - delete() - Deletar registro
 * - include - Carregar relacionamentos
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBookDto, UpdateBookDto, QueryBooksDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';

@Injectable()
export class BooksService {
  /**
   * Injeção do PrismaService
   * Como PrismaModule é @Global(), não precisamos importar em BooksModule
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo livro
   *
   * Prisma Concepts:
   * - create() - Cria um novo registro
   * - data - Objeto com os dados a serem inseridos
   * - include - Carrega relacionamentos (category, authors)
   * - availableCopies inicializado = totalCopies
   */
  async create(createBookDto: CreateBookDto) {
    return this.prisma.book.create({
      data: {
        title: createBookDto.title,
        isbn: createBookDto.isbn,
        description: createBookDto.description,
        publicationYear: createBookDto.publicationYear,
        totalCopies: createBookDto.totalCopies,
        availableCopies: createBookDto.totalCopies, // Inicialmente todas disponíveis
        categoryId: createBookDto.categoryId,
      },
      include: {
        category: true, // Inclui dados da categoria na resposta
      },
    });
  }

  /**
   * Busca todos os livros
   *
   * Prisma Concepts:
   * - findMany() - Retorna array de registros
   * - include - Carrega relacionamentos
   * - orderBy - Ordena resultados
   *
   * 💡 Use findAllWithFilters() para queries avançadas (Fase 5)
   */
  async findAll() {
    return this.prisma.book.findMany({
      include: {
        category: true,
        authors: {
          include: {
            author: true, // Inclui dados do autor através da tabela de junção
          },
        },
      },
      orderBy: {
        title: 'asc',
      },
    });
  }

  /**
   * Busca livros com filtros avançados (Fase 5)
   *
   * Conceitos Novos:
   * - Query Building Dinâmico (where conditions)
   * - Paginação (skip/take)
   * - Ordenação customizável (sortBy/sortOrder)
   * - Filtros combinados (AND logic)
   * - Busca por texto (ILIKE case-insensitive)
   * - Filtros por relacionamentos (category, author)
   *
   * Exemplos:
   * - search: "clean" → WHERE title ILIKE '%clean%' OR isbn ILIKE '%clean%' OR description ILIKE '%clean%'
   * - categoryId: 1 → WHERE categoryId = 1
   * - authorId: 2 → WHERE authors.some(author => author.id = 2)
   * - yearFrom/yearTo → WHERE publicationYear BETWEEN yearFrom AND yearTo
   * - available: true → WHERE availableCopies > 0
   */
  async findAllWithFilters(query: QueryBooksDto) {
    // Construir objeto where dinamicamente
    const where: Prisma.BookWhereInput = {};

    // Filtro: Busca por texto (título, ISBN ou descrição)
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { isbn: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Filtro: Categoria específica
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    // Filtro: Autor específico (busca na tabela de junção)
    if (query.authorId) {
      where.authors = {
        some: {
          authorId: query.authorId,
        },
      };
    }

    // Filtro: Ano de publicação (range)
    if (query.yearFrom || query.yearTo) {
      where.publicationYear = {};
      if (query.yearFrom) {
        where.publicationYear.gte = query.yearFrom; // Greater Than or Equal
      }
      if (query.yearTo) {
        where.publicationYear.lte = query.yearTo; // Less Than or Equal
      }
    }

    // Filtro: Apenas disponíveis
    if (query.available !== undefined) {
      where.availableCopies = query.available ? { gt: 0 } : { equals: 0 };
    }

    // Construir objeto orderBy
    const orderBy: Prisma.BookOrderByWithRelationInput = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'asc';
    } else {
      orderBy.title = 'asc'; // Padrão: ordenar por título
    }

    // Calcular paginação
    const skip = query.getSkip();
    const take = query.getTake();

    // Executar queries em paralelo (otimização)
    const [books, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: true,
          authors: {
            include: {
              author: true,
            },
          },
        },
      }),
      this.prisma.book.count({ where }), // Contar total de registros (para paginação)
    ]);

    // Calcular página atual
    const page = query.page || Math.floor(skip / take) + 1;

    // Retornar resposta paginada com metadados
    return new PaginatedResponseDto(books, total, page, take);
  }

  /**
   * Busca um livro por ID
   *
   * Prisma Concepts:
   * - findUnique() - Busca por campo único (@unique ou @id)
   * - where - Condições de busca
   *
   * Exception Handling:
   * - Lança NotFoundException se não encontrar
   * - HTTP 404 automático
   */
  async findOne(id: number) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        category: true,
        authors: {
          include: {
            author: true,
          },
        },
      },
    });

    if (!book) {
      throw new NotFoundException(`Livro com ID ${id} não encontrado`);
    }

    return book;
  }

  /**
   * Atualiza um livro
   *
   * Prisma Concepts:
   * - update() - Atualiza registro existente
   * - Lança exceção se não encontrar (PrismaClientKnownRequestError)
   *
   * Tratamento de erro:
   * - Primeiro verifica se existe (findOne)
   * - Se não existir, lança NotFoundException
   */
  async update(id: number, updateBookDto: UpdateBookDto) {
    // Verifica se existe
    await this.findOne(id);

    return this.prisma.book.update({
      where: { id },
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
  }

  /**
   * Remove um livro
   *
   * Prisma Concepts:
   * - delete() - Remove registro
   * - Cascata configurada no schema (BookAuthor será deletado automaticamente)
   *
   * Regra de Negócio:
   * - Não deve permitir deletar se houver empréstimos ativos
   * - 💡 Na Fase 10 implementaremos esta validação
   */
  async remove(id: number) {
    // Verifica se existe
    await this.findOne(id);

    return this.prisma.book.delete({
      where: { id },
    });
  }

  /**
   * Busca livro por ISBN
   *
   * Método auxiliar útil para evitar duplicatas
   */
  async findByIsbn(isbn: string) {
    return this.prisma.book.findUnique({
      where: { isbn },
      include: {
        category: true,
        authors: {
          include: {
            author: true,
          },
        },
      },
    });
  }
}
