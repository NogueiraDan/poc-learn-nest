/**
 * Health Module
 *
 * Módulo para health checks da aplicação
 * Usa @nestjs/terminus para verificar:
 * - Database (Prisma)
 * - Memory
 * - Disk
 */

import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './prisma.health';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [TerminusModule, PrismaModule],
  controllers: [HealthController],
  providers: [PrismaHealthIndicator],
})
export class HealthModule {}
