/**
 * Categories Service
 *
 * Gerencia operações CRUD de categorias de livros
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova categoria
   */
  async create(createCategoryDto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: createCategoryDto,
    });
  }

  /**
   * Lista todas as categorias
   * Inclui contagem de livros por categoria
   */
  async findAll() {
    return this.prisma.category.findMany({
      include: {
        _count: {
          select: { books: true }, // Conta quantos livros tem em cada categoria
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Lista categorias com filtros e paginação (Fase 5)
   */
  async findAllWithFilters(query: QueryCategoriesDto) {
    const where: Prisma.CategoryWhereInput = {};

    // Filtro: Busca por texto
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Ordenação
    const orderBy: Prisma.CategoryOrderByWithRelationInput = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'asc';
    } else {
      orderBy.name = 'asc';
    }

    // Paginação
    const skip = query.getSkip();
    const take = query.getTake();

    // Buscar dados e contar total
    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
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
      this.prisma.category.count({ where }),
    ]);

    const page = query.page || Math.floor(skip / take) + 1;
    return new PaginatedResponseDto(categories, total, page, take);
  }

  /**
   * Busca uma categoria por ID
   * Inclui lista de livros da categoria
   */
  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
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

    if (!category) {
      throw new NotFoundException(`Categoria com ID ${id} não encontrada`);
    }

    return category;
  }

  /**
   * Atualiza uma categoria
   */
  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id);

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  /**
   * Remove uma categoria
   *
   * Regra: Não permite deletar se houver livros vinculados
   */
  async remove(id: number) {
    const category = await this.findOne(id);

    if (category.books.length > 0) {
      throw new Error(
        `Não é possível deletar a categoria "${category.name}" pois existem ${category.books.length} livro(s) vinculado(s)`,
      );
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
