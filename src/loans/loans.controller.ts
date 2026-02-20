import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LoansService } from './loans.service';
import {
  CreateLoanDto,
  ReturnLoanDto,
  RenewLoanDto,
  QueryLoansDto,
} from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

/**
 * Controller para gerenciamento de empréstimos
 *
 * Endpoints:
 * - POST   /loans              - Criar empréstimo (emprestar livro)
 * - GET    /loans              - Listar empréstimos com filtros
 * - GET    /loans/:id          - Buscar empréstimo por ID
 * - PATCH  /loans/:id/return   - Devolver livro
 * - PATCH  /loans/:id/renew    - Renovar empréstimo
 * - GET    /loans/user/:userId/stats - Estatísticas do usuário
 */
@Controller({ path: 'loans', version: '1' })
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  /**
   * Criar novo empréstimo (emprestar livro)
   *
   * Apenas ADMIN e LIBRARIAN podem criar empréstimos
   *
   * @example POST /loans
   * {
   *   "userId": 1,
   *   "bookId": 3,
   *   "dueDate": "2026-03-15"  // Opcional
   * }
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createLoanDto: CreateLoanDto) {
    return this.loansService.create(createLoanDto);
  }

  /**
   * Listar empréstimos com filtros e paginação
   *
   * @example GET /loans?userId=1&status=ACTIVE&page=1&limit=10
   * @example GET /loans?bookId=3&loanDateFrom=2026-01-01
   * @example GET /loans?status=OVERDUE&sortBy=dueDate&sortOrder=asc
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  findAll(@Query() query: QueryLoansDto) {
    return this.loansService.findAll(query);
  }

  /**
   * Buscar empréstimo por ID
   *
   * @example GET /loans/1
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.loansService.findOne(id);
  }

  /**
   * Obter estatísticas de empréstimos de um usuário
   *
   * @example GET /loans/user/1/stats
   *
   * Retorna:
   * - Total de empréstimos por status
   * - Multas pendentes (count + valor total)
   */
  @Get('user/:userId/stats')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  getUserStats(@Param('userId', ParseIntPipe) userId: number) {
    return this.loansService.getUserLoanStats(userId);
  }

  /**
   * Devolver livro
   *
   * @example PATCH /loans/1/return
   * {
   *   "returnDate": "2026-03-10"  // Opcional, padrão: data/hora atual
   * }
   *
   * Se devolvido com atraso:
   * - Multa é gerada automaticamente
   * - R$ 2,00 por dia de atraso
   */
  @Patch(':id/return')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @HttpCode(HttpStatus.OK)
  returnBook(
    @Param('id', ParseIntPipe) id: number,
    @Body() returnLoanDto: ReturnLoanDto,
  ) {
    return this.loansService.returnBook(id, returnLoanDto);
  }

  /**
   * Renovar empréstimo (estender prazo)
   *
   * @example PATCH /loans/1/renew
   * {
   *   "additionalDays": 14  // Opcional, padrão: 14 dias
   * }
   *
   * Limitações:
   * - Máximo 2 renovações por empréstimo
   * - Não pode ter multas pendentes
   * - Não pode ter reservas ativas para o livro
   */
  @Patch(':id/renew')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @HttpCode(HttpStatus.OK)
  renewLoan(
    @Param('id', ParseIntPipe) id: number,
    @Body() renewLoanDto: RenewLoanDto,
  ) {
    return this.loansService.renewLoan(id, renewLoanDto);
  }
}
