import { Module, forwardRef } from '@nestjs/common';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { MessagingModule } from '../messaging/messaging.module';

/**
 * Módulo de Empréstimos (Loans)
 *
 * Gerencia todo o ciclo de vida de empréstimos:
 * - Criação (emprestar livro)
 * - Devolução (com cálculo de multas)
 * - Renovação (estender prazo)
 * - Consultas e relatórios
 *
 * Implementa regras de negócio complexas com transações
 *
 * Integração com Reservations:
 * - Ao devolver livro, confirma automaticamente primeira reserva da fila
 *
 * Integração com Messaging:
 * - Emite eventos para RabbitMQ (loan.created, loan.returned, loan.renewed)
 * - NotificationsConsumer escuta e processa (envia emails)
 */
@Module({
  imports: [
    PrismaModule,
    MessagingModule, // RabbitMQ
    forwardRef(() => ReservationsModule), // forwardRef para evitar dependência circular
  ],
  controllers: [LoansController],
  providers: [LoansService],
  exports: [LoansService],
})
export class LoansModule {}
