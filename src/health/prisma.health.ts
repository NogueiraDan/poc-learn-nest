/**
 * Prisma Health Indicator
 *
 * Verifica se a conexão com o banco de dados está funcionando
 * Usado pelo @nestjs/terminus para health checks
 */

import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Tenta fazer uma query simples para verificar conexão
      await this.prismaService.$queryRaw`SELECT 1`;
      return this.getStatus(key, true, { message: 'Database is up' });
    } catch (error) {
      throw new HealthCheckError(
        'Database check failed',
        this.getStatus(key, false, { message: error.message }),
      );
    }
  }
}
