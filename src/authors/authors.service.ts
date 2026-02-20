/**
 * Authors Service
 *
 * Gerencia operações CRUD de autores
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { QueryAuthorsDto } from './dto/query-authors.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';

@Injectable()
export class AuthorsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo autor
   */
  async create(createAuthorDto: CreateAuthorDto) {
    return this.prisma.author.create({
      data: createAuthorDto,
    });
  }

  /**
   * Lista todos os autores
   * Inclui contagem de livros por autor
   */
  async findAll() {
    return this.prisma.author.findMany({
      include: {
        _count: {
          select: { books: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Lista autores com filtros e paginação (Fase 5)
   */
  async findAllWithFilters(query: QueryAuthorsDto) {
    const where: Prisma.AuthorWhereInput = {};

    // Filtro: Busca por texto
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { biography: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Ordenação
    const orderBy: Prisma.AuthorOrderByWithRelationInput = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'asc';
    } else {
      orderBy.name = 'asc';
    }

    // Paginação
    const skip = query.getSkip();
    const take = query.getTake();

    // Buscar dados e contar total
    const [authors, total] = await Promise.all([
      this.prisma.author.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          _count: {
            select: { books: true },
          },
        },
      }),
      this.prisma.author.count({ where }),
    ]);

    const page = query.page || Math.floor(skip / take) + 1;
    return new PaginatedResponseDto(authors, total, page, take);
  }

  /**
   * Busca um autor por ID
   * Inclui lista de livros do autor
   */
  async findOne(id: number) {
    const author = await this.prisma.author.findUnique({
      where: { id },
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

    if (!author) {
      throw new NotFoundException(`Autor com ID ${id} não encontrado`);
    }

    return author;
  }

  /**
   * Atualiza um autor
   */
  async update(id: number, updateAuthorDto: UpdateAuthorDto) {
    await this.findOne(id);

    return this.prisma.author.update({
      where: { id },
      data: updateAuthorDto,
    });
  }

  /**
   * Remove um autor
   *
   * Cascade: BookAuthor será deletado automaticamente pela configuração do schema
   */
  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.author.delete({
      where: { id },
    });
  }
}
