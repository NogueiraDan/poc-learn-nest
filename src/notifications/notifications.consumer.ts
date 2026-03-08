import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import {
  MESSAGING_EVENTS,
  LoanCreatedEvent,
  LoanReturnedEvent,
  LoanRenewedEvent,
  LoanOverdueEvent,
  ReservationConfirmedEvent,
  FineCreatedEvent,
} from '../messaging';
import { EmailService } from './services/email.service';
import { FailureMonitorService } from './services/failure-monitor.service';

/**
 * NotificationsConsumer
 *
 * Conceitos:
 * - Consumer: Escuta eventos de uma fila RabbitMQ
 * - @EventPattern: Decorator que indica qual evento escutar
 * - @Payload: Extrai os dados do evento
 * - Event-Driven: Reage a eventos emitidos por outros serviços
 *
 * Funcionamento:
 * 1. LoansService emite evento 'loan.created'
 * 2. RabbitMQ roteia para a fila
 * 3. NotificationsConsumer recebe e processa
 * 4. EmailService envia a notificação
 *
 * Vantagens:
 * - Desacoplamento: LoansService não precisa conhecer EmailService
 * - Async: Não bloqueia a resposta HTTP
 * - Escalável: Pode ter múltiplos consumers processando em paralelo
 * - Resiliente: Se falhar, RabbitMQ pode reprocessar
 */
@Controller()
export class NotificationsConsumer {
  private readonly logger = new Logger(NotificationsConsumer.name);
  private readonly MAX_RETRIES = 3;

  constructor(
    private readonly emailService: EmailService,
    private readonly failureMonitor: FailureMonitorService,
  ) {}

  /**
   * Processa mensagem com retry automático
   * 
   * Conceitos:
   * - Retry Logic: Tentar novamente em caso de falha
   * - Exponential Backoff: Aumentar delay entre tentativas
   * - Circuit Breaker: Prevenir sobrecarga do sistema
   * 
   * Fluxo:
   * 1. Tenta processar
   * 2. Se falhar, aguarda e tenta novamente (backoff exponencial)
   * 3. Após MAX_RETRIES, rejeita mensagem → vai para DLQ
   * 4. Se sucesso após retry, confirma (ACK)
   */
  private async processWithRetry<T>(
    eventName: string,
    payload: T,
    context: RmqContext,
    processor: (data: T) => Promise<void>,
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const headers = (originalMsg as any).properties?.headers || {};
    
    // Contador de tentativas (RabbitMQ rastreia automaticamente)
    const retryCount = headers['x-retry-count'] || 0;

    try {
      // Processar a mensagem
      await processor(payload);

      // Sucesso! Confirmar mensagem
      channel.ack(originalMsg);

      // Se foi retry, logar sucesso
      if (retryCount > 0) {
        this.failureMonitor.recordRetrySuccess(eventName, retryCount + 1);
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao processar ${eventName}:`, error.message);

      // Registrar falha
      this.failureMonitor.recordFailure(eventName, error, payload, retryCount + 1);

      // Verificar se ainda pode tentar novamente
      if (retryCount < this.MAX_RETRIES) {
        // Calcular delay com backoff exponencial
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, 8s...
        
        this.logger.warn(
          `🔁 Tentativa ${retryCount + 1}/${this.MAX_RETRIES} falhou. Reagendando em ${delay}ms...`,
        );

        // Rejeitar mas pedir para requeue (volta para a fila)
        // NestJS/RabbitMQ vai reprocessar automaticamente
        channel.nack(originalMsg, false, true);

        // Incrementar contador de retries no header
        headers['x-retry-count'] = retryCount + 1;
      } else {
        // Esgotou tentativas → rejeitar sem requeue → vai para DLQ
        this.logger.error(
          `💀 Mensagem ${eventName} esgotou ${this.MAX_RETRIES} tentativas. Enviando para DLQ...`,
        );

        // Salvar evento original no header para DLQ saber qual evento falhou
        headers['x-original-event'] = eventName;
        headers['x-first-death-time'] = new Date().toISOString();

        // NACK sem requeue → vai para DLQ
        channel.nack(originalMsg, false, false);
      }
    }
  }

  /**
   * Evento: Empréstimo criado
   * Envia email de confirmação para o usuário
   */
  @EventPattern(MESSAGING_EVENTS.LOAN_CREATED)
  async handleLoanCreated(
    @Payload() data: LoanCreatedEvent,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`📥 Evento recebido: ${MESSAGING_EVENTS.LOAN_CREATED}`);
    this.logger.debug(`   Dados: ${JSON.stringify(data)}`);

    await this.processWithRetry(
      MESSAGING_EVENTS.LOAN_CREATED,
      data,
      context,
      async (payload) => {
        await this.emailService.sendLoanConfirmation({
          userEmail: payload.userEmail,
          userName: payload.userName,
          bookTitle: payload.bookTitle,
          dueDate: payload.dueDate,
        });

        this.logger.log(
          `✅ Email de confirmação enviado para ${payload.userEmail}\n`,
        );
      },
    );
  }

  /**
   * Evento: Empréstimo devolvido
   * Se houver multa, envia notificação
   */
  @EventPattern(MESSAGING_EVENTS.LOAN_RETURNED)
  async handleLoanReturned(
    @Payload() data: LoanReturnedEvent,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`📥 Evento recebido: ${MESSAGING_EVENTS.LOAN_RETURNED}`);
    this.logger.debug(`   Dados: ${JSON.stringify(data)}`);

    await this.processWithRetry(
      MESSAGING_EVENTS.LOAN_RETURNED,
      data,
      context,
      async (payload) => {
        // Apenas envia email se houve atraso (multa gerada)
        if (payload.wasOverdue && payload.fineAmount) {
          this.logger.log('   ⚠️  Empréstimo com atraso detectado');
          // Multa será notificada pelo evento FINE_CREATED
        } else {
          this.logger.log('   ✅ Devolução sem atrasos\n');
        }
      },
    );
  }

  /**
   * Evento: Empréstimo renovado
   * Envia confirmação de renovação
   */
  @EventPattern(MESSAGING_EVENTS.LOAN_RENEWED)
  async handleLoanRenewed(
    @Payload() data: LoanRenewedEvent,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`📥 Evento recebido: ${MESSAGING_EVENTS.LOAN_RENEWED}`);
    this.logger.debug(`   Dados: ${JSON.stringify(data)}`);

    await this.processWithRetry(
      MESSAGING_EVENTS.LOAN_RENEWED,
      data,
      context,
      async (payload) => {
        await this.emailService.sendLoanRenewal({
          userEmail: payload.userEmail,
          userName: payload.userName,
          bookTitle: payload.bookTitle,
          newDueDate: payload.newDueDate,
          renewalCount: payload.renewalCount,
        });

        this.logger.log(`✅ Email de renovação enviado\n`);
      },
    );
  }

  /**
   * Evento: Empréstimo atrasado
   * Disparado por cronjob diário
   */
  @EventPattern(MESSAGING_EVENTS.LOAN_OVERDUE)
  async handleLoanOverdue(
    @Payload() data: LoanOverdueEvent,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`📥 Evento recebido: ${MESSAGING_EVENTS.LOAN_OVERDUE}`);
    this.logger.debug(`   Dados: ${JSON.stringify(data)}`);

    await this.processWithRetry(
      MESSAGING_EVENTS.LOAN_OVERDUE,
      data,
      context,
      async (payload) => {
        await this.emailService.sendOverdueNotification({
          userEmail: payload.userEmail,
          userName: payload.userName,
          bookTitle: payload.bookTitle,
          dueDate: payload.dueDate,
          daysOverdue: payload.daysOverdue,
        });

        this.logger.log(`✅ Notificação de atraso enviada\n`);
      },
    );
  }

  /**
   * Evento: Reserva confirmada
   * Livro ficou disponível, usuário pode retirar
   */
  @EventPattern(MESSAGING_EVENTS.RESERVATION_CONFIRMED)
  async handleReservationConfirmed(
    @Payload() data: ReservationConfirmedEvent,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      `📥 Evento recebido: ${MESSAGING_EVENTS.RESERVATION_CONFIRMED}`,
    );
    this.logger.debug(`   Dados: ${JSON.stringify(data)}`);

    await this.processWithRetry(
      MESSAGING_EVENTS.RESERVATION_CONFIRMED,
      data,
      context,
      async (payload) => {
        await this.emailService.sendReservationConfirmed({
          userEmail: payload.userEmail,
          userName: payload.userName,
          bookTitle: payload.bookTitle,
        });

        this.logger.log(`✅ Email de reserva confirmada enviado\n`);
      },
    );
  }

  /**
   * Evento: Multa criada
   * Notifica usuário sobre a multa gerada
   */
  @EventPattern(MESSAGING_EVENTS.FINE_CREATED)
  async handleFineCreated(
    @Payload() data: FineCreatedEvent,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`📥 Evento recebido: ${MESSAGING_EVENTS.FINE_CREATED}`);
    this.logger.debug(`   Dados: ${JSON.stringify(data)}`);

    await this.processWithRetry(
      MESSAGING_EVENTS.FINE_CREATED,
      data,
      context,
      async (payload) => {
        await this.emailService.sendFineNotification({
          userEmail: payload.userEmail,
          userName: payload.userName,
          amount: payload.amount,
          reason: payload.reason,
        });

        this.logger.log(`✅ Notificação de multa enviada\n`);
      },
    );
  }
}
