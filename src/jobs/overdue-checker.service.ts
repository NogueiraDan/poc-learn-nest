import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';
import { MESSAGING_EVENTS, LoanOverdueEvent } from '../messaging';

/**
 * OverdueCheckerService
 *
 * Conceitos:
 * - Scheduled Jobs (Cronjobs): Tarefas automatizadas que rodam periodicamente
 * - @Cron: Decorator que agenda execução baseada em cron expression
 * - Background Tasks: Processamento que não depende de ação do usuário
 *
 * Responsabilidades:
 * - Verificar empréstimos atrasados diariamente
 * - Emitir eventos para notificação de usuários
 * - Atualizar status de empréstimos para OVERDUE
 *
 * Cron Expressions:
 * - EVERY_DAY_AT_MIDNIGHT: '0 0 * * *' (00:00)
 * - EVERY_DAY_AT_NOON: '0 12 * * *' (12:00)
 * - EVERY_HOUR: '0 * * * *'
 * - EVERY_30_MINUTES: '* /30 * * * *'
 *
 * Em produção:
 * - Pode rodar em servidor separado (worker)
 * - Pode usar Redis para lock distribuído (evita execução duplicada)
 * - Pode ter retry mechanism
 */
@Injectable()
export class OverdueCheckerService {
  private readonly logger = new Logger(OverdueCheckerService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
  ) {}

  /**
   * Verifica empréstimos atrasados
   * Roda todo dia à meia-noite (00:00)
   *
   * Para testar manualmente: altere para EVERY_10_SECONDS ou EVERY_MINUTE
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'check-overdue-loans',
    timeZone: 'America/Sao_Paulo',
  })
  async checkOverdueLoans(): Promise<void> {
    this.logger.log(
      '🔍 [CRONJOB] Iniciando verificação de empréstimos atrasados...',
    );

    const startTime = Date.now();
    const now = new Date();

    try {
      // Buscar empréstimos ACTIVE com vencimento passado
      const overdueLoans = await this.prisma.loan.findMany({
        where: {
          status: 'ACTIVE',
          dueDate: {
            lt: now, // less than (menor que agora)
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          book: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      if (overdueLoans.length === 0) {
        this.logger.log('   ✅ Nenhum empréstimo atrasado encontrado\n');
        return;
      }

      this.logger.log(
        `   📊 ${overdueLoans.length} empréstimo(s) atrasado(s) encontrado(s)`,
      );

      // Processar cada empréstimo atrasado
      for (const loan of overdueLoans) {
        const daysOverdue = this.calculateDaysOverdue(loan.dueDate);

        this.logger.warn(
          `   ⚠️  Loan #${loan.id} - ${loan.book.title} - ${daysOverdue} dias de atraso`,
        );

        // 1. Atualizar status para OVERDUE
        await this.prisma.loan.update({
          where: { id: loan.id },
          data: { status: 'OVERDUE' },
        });

        // 2. Emitir evento para notificar usuário
        const event: LoanOverdueEvent = {
          loanId: loan.id,
          userId: loan.user.id,
          userEmail: loan.user.email,
          userName: loan.user.name,
          bookId: loan.book.id,
          bookTitle: loan.book.title,
          dueDate: loan.dueDate,
          daysOverdue,
        };

        this.rabbitClient.emit(MESSAGING_EVENTS.LOAN_OVERDUE, event);
        this.logger.log(
          `   📤 Evento emitido: ${MESSAGING_EVENTS.LOAN_OVERDUE}`,
        );
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `\n✅ [CRONJOB] Verificação concluída em ${duration}ms - ${overdueLoans.length} empréstimo(s) processado(s)\n`,
      );
    } catch (error) {
      this.logger.error(
        `❌ [CRONJOB] Erro ao verificar empréstimos atrasados:`,
        error.stack,
      );
      // Em produção: enviar alerta para equipe de ops
    }
  }

  /**
   * Calcula quantos dias de atraso
   */
  private calculateDaysOverdue(dueDate: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(dueDate).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Para facilitar testes, você pode criar um método manual:
   */
  async checkOverdueLoansManual(): Promise<{ processed: number }> {
    await this.checkOverdueLoans();
    return { processed: 1 };
  }
}
