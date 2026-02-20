/**
 * Prisma Module
 * 
 * Conceitos NestJS:
 * 
 * 1. @Global() - Torna o módulo disponível globalmente
 *    - Não precisa importar PrismaModule em cada módulo que usa PrismaService
 *    - Basta importar uma vez no AppModule
 * 
 * 2. exports: [PrismaService] - Exporta o service para outros módulos
 *    - Permite injeção de dependência do PrismaService em qualquer lugar
 * 
 * Por que usar @Global()?
 * - PrismaService é usado em praticamente todos os módulos
 * - Evita imports repetitivos
 * - Centraliza a gestão de conexão com banco
 * 
 * Este é um padrão comum para services de infraestrutura
 * (Database, Logger, Config, etc.)
 */

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
