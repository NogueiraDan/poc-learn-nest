/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * Prisma Service
 *
 * Conceitos NestJS + Prisma:
 *
 * 1. Estende PrismaClient - Herda todas as funcionalidades do Prisma
 * 2. Implementa OnModuleInit - Hook executado quando o módulo é inicializado
 * 3. Implementa OnModuleDestroy - Hook executado quando a aplicação é encerrada
 *
 * Lifecycle Hooks:
 * - onModuleInit(): Conecta ao banco quando o módulo inicia
 * - enableShutdownHooks(): Garante desconexão limpa ao encerrar
 *
 * Por que isso é importante?
 * - Gerencia conexões de forma eficiente
 * - Evita connection leaks
 * - Garante que a aplicação encerre graciosamente
 *
 * Este serviço será injetado em todos os services que precisam acessar o banco
 *
 * Prisma 7:
 * - Usa adapter para conectar ao PostgreSQL
 * - Requer @prisma/adapter-pg e pg
 */

import 'dotenv/config';
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor() {
    // Cria connection pool do PostgreSQL
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);

    // Passa o adapter para o PrismaClient
    super({ adapter });

    this.pool = pool;
  }

  /**
   * Hook executado quando o módulo é inicializado
   * Conecta ao banco de dados
   */
  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ Conectado ao banco de dados PostgreSQL via Prisma');
  }

  /**
   * Hook executado quando a aplicação é encerrada
   * Desconecta do banco de dados de forma limpa
   */
  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('🔌 Desconectado do banco de dados PostgreSQL');
  }
}
