import { Module, forwardRef } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LoansModule } from '../loans/loans.module';

/**
 * Módulo de Reservas (Reservations)
 * 
 * Gerencia fila de espera de livros indisponíveis:
 * - Criação de reservas
 * - Fila FIFO (First In, First Out)
 * - Confirmação automática quando livro fica disponível
 * - Cancelamento de reservas
 * - Conversão em empréstimo
 */
@Module({
  imports: [
    PrismaModule,
    forwardRef(() => LoansModule), // forwardRef para evitar dependência circular
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
