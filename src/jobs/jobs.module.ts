import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { OverdueCheckerService } from './overdue-checker.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MessagingModule } from '../messaging/messaging.module';

/**
 * JobsModule
 *
 * Conceitos:
 * - Scheduled Tasks: Tarefas automatizadas executadas periodicamente
 * - Workers: Processos que rodam em background
 * - Cron Jobs: Agendamento baseado em expressões cron
 *
 * Responsabilidades:
 * - Agendar e executar tarefas periódicas
 * - Verificação de empréstimos atrasados (diária)
 * - Limpeza de dados antigos (futura)
 * - Geração de relatórios (futura)
 *
 * Dependências:
 * - @nestjs/schedule: Módulo de agendamento do NestJS
 * - PrismaModule: Acesso ao banco de dados
 * - MessagingModule: Emitir eventos para RabbitMQ
 */
@Module({
  imports: [
    ScheduleModule.forRoot(), // Habilita scheduled tasks
    PrismaModule,
    MessagingModule,
  ],
  providers: [OverdueCheckerService],
  exports: [OverdueCheckerService],
})
export class JobsModule {}
