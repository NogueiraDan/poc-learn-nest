import { Module, forwardRef } from '@nestjs/common';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ReservationsModule } from '../reservations/reservations.module';

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
 */
@Module({
  imports: [
    PrismaModule,
    forwardRef(() => ReservationsModule), // forwardRef para evitar dependência circular
  ],
  controllers: [LoansController],
  providers: [LoansService],
  exports: [LoansService],
})
export class LoansModule {}
