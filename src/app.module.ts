/**
 * App Module - Módulo Raiz da Aplicação
 * 
 * Conceitos NestJS:
 * 
 * 1. AppModule é o módulo raiz que inicia toda a aplicação
 * 2. Todos os outros módulos devem ser importados aqui (direta ou indiretamente)
 * 3. O NestJS usa este módulo como ponto de partida no main.ts
 * 
 * Arquitetura Modular:
 * - imports: [] - Lista de módulos que esta aplicação usa
 * - À medida que criamos novos módulos (Users, Authors, Loans, etc.)
 *   vamos adicioná-los aqui
 *
 * Fase 4 - Autenticação:
 * - APP_GUARD com JwtAuthGuard protege TODAS as rotas por padrão
 * - Use @Public() decorator para rotas públicas
 * - APP_GUARD com RolesGuard verifica permissões baseadas em roles
 */

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BooksModule } from './books/books.module';
import { PrismaModule } from './prisma/prisma.module';
import { CategoriesModule } from './categories/categories.module';
import { AuthorsModule } from './authors/authors.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { LoansModule } from './loans/loans.module';
import { ReservationsModule } from './reservations/reservations.module';
import { LoggerMiddleware } from './common/middleware';
import { HealthModule } from './health/health.module';
import { MessagingModule } from './messaging/messaging.module';
import { NotificationsModule } from './notifications/notifications.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    // Segurança: Rate Limiting
    // Limita: 10 requisições por 60 segundos por IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 segundos
        limit: 10, // 10 requisições
      },
    ]),
    PrismaModule, // @Global - Disponível em toda aplicação
    AuthModule, // Autenticação e Autorização
    CategoriesModule,
    AuthorsModule,
    BooksModule,
    LoansModule, // Fase 6 - Empréstimos
    ReservationsModule, // Fase 6 - Reservas
    MessagingModule, // RabbitMQ - Message Broker
    NotificationsModule, // Consumers de eventos (email, etc)
    JobsModule, // Scheduled tasks (cronjobs)
    HealthModule, // Health Checks
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Guards Globais - Aplicados a TODAS as rotas
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Rate limiting (10 req/60s)
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Valida JWT em todas as rotas (exceto @Public)
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // Verifica roles (se definidas via @Roles)
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplica LoggerMiddleware em TODAS as rotas
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
