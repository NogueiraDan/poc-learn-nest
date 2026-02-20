/**
 * Health Controller
 *
 * Endpoints de verificação de saúde da aplicação
 * Útil para:
 * - Kubernetes liveness/readiness probes
 * - Load balancers
 * - Monitoring tools (Prometheus, Datadog, etc.)
 *
 * Endpoints:
 * - GET /health         - Health check completo (database, memory, disk)
 * - GET /health/liveness  - Check básico (aplicação está rodando?)
 * - GET /health/readiness - Check se está pronta para receber tráfego
 */

import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaHealthIndicator } from './prisma.health';

@ApiTags('Health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  /**
   * Health Check Completo
   * Verifica: Database, Memory, Disk
   */
  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check completo da aplicação' })
  @ApiResponse({
    status: 200,
    description: 'Aplicação saudável',
    schema: {
      example: {
        status: 'ok',
        info: {
          database: { status: 'up', message: 'Database is up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
          storage: { status: 'up' },
        },
        error: {},
        details: {
          database: { status: 'up', message: 'Database is up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
          storage: { status: 'up' },
        },
      },
    },
  })
  @ApiResponse({ status: 503, description: 'Aplicação não saudável' })
  check() {
    return this.health.check([
      // Verifica conexão com banco de dados
      () => this.prismaHealth.isHealthy('database'),

      // Verifica uso de memória heap (máximo 300MB)
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),

      // Verifica uso de memória RSS (máximo 300MB)
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),

      // Verifica espaço em disco (mínimo 10% livre)
      () =>
        this.disk.checkStorage('storage', {
          path: process.cwd(),
          thresholdPercent: 0.9, // Alerta se usar mais de 90%
        }),
    ]);
  }

  /**
   * Liveness Probe
   * Kubernetes: Se falhar, reinicia o pod
   * Verifica apenas se a aplicação está respondendo
   */
  @Public()
  @Get('liveness')
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness probe - aplicação está rodando?' })
  @ApiResponse({ status: 200, description: 'Aplicação está viva' })
  liveness() {
    return this.health.check([
      // Check básico de memória
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),
    ]);
  }

  /**
   * Readiness Probe
   * Kubernetes: Se falhar, remove do load balancer
   * Verifica se está pronta para receber requisições
   */
  @Public()
  @Get('readiness')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe - pronta para receber tráfego?' })
  @ApiResponse({ status: 200, description: 'Aplicação está pronta' })
  @ApiResponse({ status: 503, description: 'Aplicação não está pronta' })
  readiness() {
    return this.health.check([
      // Database deve estar acessível
      () => this.prismaHealth.isHealthy('database'),

      // Memória não pode estar muito alta
      () => this.memory.checkHeap('memory_heap', 400 * 1024 * 1024),
    ]);
  }
}
