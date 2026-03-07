import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
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

  constructor(private readonly emailService: EmailService) {}

  /**
   * Evento: Empréstimo criado
   * Envia email de confirmação para o usuário
   */
  @EventPattern(MESSAGING_EVENTS.LOAN_CREATED)
  async handleLoanCreated(@Payload() data: LoanCreatedEvent) {
    this.logger.log(`📥 Evento recebido: ${MESSAGING_EVENTS.LOAN_CREATED}`);
    this.logger.debug(`   Dados: ${JSON.stringify(data)}`);

    try {
      await this.emailService.sendLoanConfirmation({
        userEmail: data.userEmail,
        userName: data.userName,
        bookTitle: data.bookTitle,
        dueDate: data.dueDate,
      });

      this.logger.log(
        `✅ Email de confirmação enviado para ${data.userEmail}\n`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Erro ao enviar email: ${error.message}`,
        error.stack,
      );
      // Em produção, você poderia:
      // - Reenviar para Dead Letter Queue
      // - Tentar novamente (retry)
      // - Alertar equipe de ops
    }
  }

  /**
   * Evento: Empréstimo devolvido
   * Se houver multa, envia notificação
   */
  @EventPattern(MESSAGING_EVENTS.LOAN_RETURNED)
  async handleLoanReturned(@Payload() data: LoanReturnedEvent) {
    this.logger.log(`📥 Evento recebido: ${MESSAGING_EVENTS.LOAN_RETURNED}`);
    this.logger.debug(`   Dados: ${JSON.stringify(data)}`);

    // Apenas envia email se houve atraso (multa gerada)
    if (data.wasOverdue && data.fineAmount) {
      this.logger.log('   ⚠️  Empréstimo com atraso detectado');
      // Multa será notificada pelo evento FINE_CREATED
    } else {
      this.logger.log('   ✅ Devolução sem atrasos\n');
    }
  }

  /**
   * Evento: Empréstimo renovado
   * Envia confirmação de renovação
   */
  @EventPattern(MESSAGING_EVENTS.LOAN_RENEWED)
  async handleLoanRenewed(@Payload() data: LoanRenewedEvent) {
    this.logger.log(`📥 Evento recebido: ${MESSAGING_EVENTS.LOAN_RENEWED}`);
    this.logger.debug(`   Dados: ${JSON.stringify(data)}`);

    try {
      await this.emailService.sendLoanRenewal({
        userEmail: data.userEmail,
        userName: data.userName,
        bookTitle: data.bookTitle,
        newDueDate: data.newDueDate,
        renewalCount: data.renewalCount,
      });

      this.logger.log(`✅ Email de renovação enviado\n`);
    } catch (error) {
      this.logger.error(
        `❌ Erro ao enviar email: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Evento: Empréstimo atrasado
   * Disparado por cronjob diário
   */
  @EventPattern(MESSAGING_EVENTS.LOAN_OVERDUE)
  async handleLoanOverdue(@Payload() data: LoanOverdueEvent) {
    this.logger.log(`📥 Evento recebido: ${MESSAGING_EVENTS.LOAN_OVERDUE}`);
    this.logger.debug(`   Dados: ${JSON.stringify(data)}`);

    try {
      await this.emailService.sendOverdueNotification({
        userEmail: data.userEmail,
        userName: data.userName,
        bookTitle: data.bookTitle,
        dueDate: data.dueDate,
        daysOverdue: data.daysOverdue,
      });

      this.logger.log(`✅ Notificação de atraso enviada\n`);
    } catch (error) {
      this.logger.error(
        `❌ Erro ao enviar email: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Evento: Reserva confirmada
   * Livro ficou disponível, usuário pode retirar
   */
  @EventPattern(MESSAGING_EVENTS.RESERVATION_CONFIRMED)
  async handleReservationConfirmed(@Payload() data: ReservationConfirmedEvent) {
    this.logger.log(
      `📥 Evento recebido: ${MESSAGING_EVENTS.RESERVATION_CONFIRMED}`,
    );
    this.logger.debug(`   Dados: ${JSON.stringify(data)}`);

    try {
      await this.emailService.sendReservationConfirmed({
        userEmail: data.userEmail,
        userName: data.userName,
        bookTitle: data.bookTitle,
      });

      this.logger.log(`✅ Email de reserva confirmada enviado\n`);
    } catch (error) {
      this.logger.error(
        `❌ Erro ao enviar email: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Evento: Multa criada
   * Notifica usuário sobre a multa gerada
   */
  @EventPattern(MESSAGING_EVENTS.FINE_CREATED)
  async handleFineCreated(@Payload() data: FineCreatedEvent) {
    this.logger.log(`📥 Evento recebido: ${MESSAGING_EVENTS.FINE_CREATED}`);
    this.logger.debug(`   Dados: ${JSON.stringify(data)}`);

    try {
      await this.emailService.sendFineNotification({
        userEmail: data.userEmail,
        userName: data.userName,
        amount: data.amount,
        reason: data.reason,
      });

      this.logger.log(`✅ Notificação de multa enviada\n`);
    } catch (error) {
      this.logger.error(
        `❌ Erro ao enviar email: ${error.message}`,
        error.stack,
      );
    }
  }
}
