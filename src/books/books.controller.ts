/**
 * Books Controller - Rotas e Endpoints
 *
 * Conceitos NestJS Importantes:
 *
 * 1. @Controller('books') - Define que esta classe gerencia a rota /books
 *    - Centraliza todas as rotas relacionadas a books
 *    - O NestJS automaticamente registra essas rotas
 *
 * 2. Decorators de HTTP (@Get, @Post, @Put, @Patch, @Delete)
 *    - Mapeiam métodos para verbos HTTP
 *    - @Get('books') + @Controller('books') = GET /books
 *
 * 3. Injeção de Dependência (Constructor Injection)
 *    - BooksService é injetado automaticamente pelo NestJS
 *    - Não precisamos fazer new BooksService() manualmente
 *    - O NestJS gerencia instâncias únicas (Singleton por padrão)
 *
 * 4. @Param, @Body - Decorators para extrair dados da requisição
 *    - @Param('id') - Extrai parâmetros da URL
 *    - @Body() - Extrai o corpo da requisição (JSON)
 *
 * 5. ParseIntPipe - Transforma e valida string para number
 *    - Converte automaticamente '123' para 123
 *    - Retorna erro 400 se não for um número válido
 *
 * Fase 4 - Autenticação:
 * - GET rotas são públicas (@Public)
 * - POST/PATCH/DELETE requerem autenticação (JWT)
 * - Apenas ADMIN e LIBRARIAN podem criar/atualizar/deletar
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto, UpdateBookDto, QueryBooksDto } from './dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Books')
@Controller({ path: 'books', version: '1' })
export class BooksController {
  /**
   * Injeção de Dependência via Constructor
   * - O 'private' automaticamente cria e inicializa a propriedade
   * - O readonly garante que não será reatribuída
   */
  constructor(private readonly booksService: BooksService) {}

  /**
   * POST /books - Criar um novo livro
   *
   * Protegido: Requer autenticação + Role ADMIN ou LIBRARIAN
   */
  @ApiOperation({ summary: 'Criar um novo livro' })
  @ApiResponse({
    status: 201,
    description: 'Livro criado com sucesso',
    schema: {
      example: {
        id: 1,
        title: 'Clean Code',
        isbn: '978-0132350884',
        description: 'Um guia prático para escrever código limpo',
        totalCopies: 5,
        availableCopies: 5,
        publicationYear: 2008,
        categoryId: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (requer ADMIN ou LIBRARIAN)' })
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createBookDto: CreateBookDto) {
    return this.booksService.create(createBookDto);
  }

  /**
   * GET /books - Listar todos os livros (com filtros opcionais)
   *
   * Público: Não requer autenticação
   *
   * Query Parameters (todos opcionais):
   * - search: Busca por título, ISBN ou descrição
   * - categoryId: Filtrar por categoria
   * - authorId: Filtrar por autor
   * - yearFrom/yearTo: Filtrar por ano de publicação
   * - available: Apenas livros disponíveis
   * - page: Número da página (padrão 1)
   * - limit: Registros por página (padrão 10, máximo 100)
   * - sortBy: Campo para ordenar (title, isbn, publicationYear, createdAt)
   * - sortOrder: Direção (asc ou desc)
   *
   * Exemplos:
   * GET /books
   * GET /books?search=clean%20code
   * GET /books?categoryId=1&page=2&limit=20
   * GET /books?authorId=3&yearFrom=2020&sortBy=title&sortOrder=desc
   */
  @ApiOperation({ summary: 'Listar todos os livros com filtros opcionais' })
  @ApiQuery({ name: 'search', required: false, description: 'Busca por título, ISBN ou descrição' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filtrar por categoria', type: Number })
  @ApiQuery({ name: 'authorId', required: false, description: 'Filtrar por autor', type: Number })
  @ApiQuery({ name: 'yearFrom', required: false, description: 'Ano mínimo de publicação', type: Number })
  @ApiQuery({ name: 'yearTo', required: false, description: 'Ano máximo de publicação', type: Number })
  @ApiQuery({ name: 'available', required: false, description: 'Apenas livros disponíveis', type: Boolean })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Registros por página', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lista de livros',
    schema: {
      example: {
        data: [
          {
            id: 1,
            title: 'Clean Code',
            isbn: '978-0132350884',
            totalCopies: 5,
            availableCopies: 3,
            publicationYear: 2008,
            category: { id: 1, name: 'Tecnologia' },
          },
        ],
        meta: {
          total: 50,
          page: 1,
          limit: 10,
          totalPages: 5,
        },
      },
    },
  })
  @Public()
  @Get()
  findAll(@Query() query: QueryBooksDto) {
    // Se não houver filtros, usa método simples (retrocompatibilidade)
    if (Object.keys(query).length === 0) {
      return this.booksService.findAll();
    }
    // Com filtros, usa método avançado
    return this.booksService.findAllWithFilters(query);
  }

  /**
   * GET /books/:id - Buscar um livro específico
   *
   * Público: Não requer autenticação
   */
  @ApiOperation({ summary: 'Buscar um livro por ID' })
  @ApiParam({ name: 'id', description: 'ID do livro', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Livro encontrado',
    schema: {
      example: {
        id: 1,
        title: 'Clean Code',
        isbn: '978-0132350884',
        description: 'Um guia prático para escrever código limpo',
        totalCopies: 5,
        availableCopies: 3,
        publicationYear: 2008,
        category: { id: 1, name: 'Tecnologia' },
        authors: [
          { id: 1, name: 'Robert C. Martin' },
        ],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Livro não encontrado' })
  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.findOne(id);
  }

  /**
   * PATCH /books/:id - Atualizar parcialmente um livro
   *
   * Protegido: Requer autenticação + Role ADMIN ou LIBRARIAN
   */
  @ApiOperation({ summary: 'Atualizar um livro' })
  @ApiParam({ name: 'id', description: 'ID do livro', type: Number })
  @ApiResponse({ status: 200, description: 'Livro atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Livro não encontrado' })
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookDto: UpdateBookDto,
  ) {
    return this.booksService.update(id, updateBookDto);
  }

  /**
   * DELETE /books/:id - Remover um livro
   *
   * Protegido: Requer autenticação + Role ADMIN ou LIBRARIAN
   */
  @ApiOperation({ summary: 'Remover um livro' })
  @ApiParam({ name: 'id', description: 'ID do livro', type: Number })
  @ApiResponse({ status: 204, description: 'Livro removido com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Livro não encontrado' })
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.remove(id);
  }
}
