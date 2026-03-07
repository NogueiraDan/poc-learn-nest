import { Injectable, Logger } from '@nestjs/common';

/**
 * EmailService (Mock)
 *
 * Conceitos:
 * - Este é um MOCK SERVICE - apenas simula envio de emails
 * - Em produção, você poderia integrar com:
 *   • NodeMailer (SMTP)
 *   • SendGrid
 *   • Amazon SES
 *   • Mailgun
 *   • Postmark
 *
 * Por que mock?
 * - Não requer configuração de SMTP
 * - Facilita testes e desenvolvimento
 * - Pode ser facilmente substituído depois
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  /**
   * Envia email de confirmação de empréstimo
   */
  async sendLoanConfirmation(data: {
    userEmail: string;
    userName: string;
    bookTitle: string;
    dueDate: Date;
  }): Promise<void> {
    this.logger.log('📧 [EMAIL] Confirmação de Empréstimo');
    this.logger.log(`   Para: ${data.userEmail}`);
    this.logger.log(`   Nome: ${data.userName}`);
    this.logger.log(`   Livro: ${data.bookTitle}`);
    this.logger.log(`   Vencimento: ${this.formatDate(data.dueDate)}`);
    this.logger.log('   ✅ Email "enviado" com sucesso!\n');

    // Simula delay de envio de email
    await this.simulateDelay(100);
  }

  /**
   * Envia email de lembrete de vencimento próximo
   */
  async sendDueDateReminder(data: {
    userEmail: string;
    userName: string;
    bookTitle: string;
    dueDate: Date;
    daysUntilDue: number;
  }): Promise<void> {
    this.logger.warn('⏰ [EMAIL] Lembrete de Vencimento');
    this.logger.log(`   Para: ${data.userEmail}`);
    this.logger.log(`   Nome: ${data.userName}`);
    this.logger.log(`   Livro: ${data.bookTitle}`);
    this.logger.log(
      `   Vence em: ${data.daysUntilDue} dias (${this.formatDate(data.dueDate)})`,
    );
    this.logger.log('   ✅ Email "enviado" com sucesso!\n');

    await this.simulateDelay(100);
  }

  /**
   * Envia email de empréstimo atrasado
   */
  async sendOverdueNotification(data: {
    userEmail: string;
    userName: string;
    bookTitle: string;
    dueDate: Date;
    daysOverdue: number;
  }): Promise<void> {
    this.logger.error('🚨 [EMAIL] Notificação de Atraso');
    this.logger.log(`   Para: ${data.userEmail}`);
    this.logger.log(`   Nome: ${data.userName}`);
    this.logger.log(`   Livro: ${data.bookTitle}`);
    this.logger.log(`   Vencimento: ${this.formatDate(data.dueDate)}`);
    this.logger.log(`   Dias de atraso: ${data.daysOverdue}`);
    this.logger.log('   ⚠️  Multa será aplicada na devolução!');
    this.logger.log('   ✅ Email "enviado" com sucesso!\n');

    await this.simulateDelay(100);
  }

  /**
   * Envia email de reserva confirmada
   */
  async sendReservationConfirmed(data: {
    userEmail: string;
    userName: string;
    bookTitle: string;
  }): Promise<void> {
    this.logger.log('🎉 [EMAIL] Reserva Confirmada');
    this.logger.log(`   Para: ${data.userEmail}`);
    this.logger.log(`   Nome: ${data.userName}`);
    this.logger.log(`   Livro: ${data.bookTitle}`);
    this.logger.log('   📚 O livro está disponível para retirada!');
    this.logger.log('   ✅ Email "enviado" com sucesso!\n');

    await this.simulateDelay(100);
  }

  /**
   * Envia email de renovação de empréstimo
   */
  async sendLoanRenewal(data: {
    userEmail: string;
    userName: string;
    bookTitle: string;
    newDueDate: Date;
    renewalCount: number;
  }): Promise<void> {
    this.logger.log('🔄 [EMAIL] Renovação de Empréstimo');
    this.logger.log(`   Para: ${data.userEmail}`);
    this.logger.log(`   Nome: ${data.userName}`);
    this.logger.log(`   Livro: ${data.bookTitle}`);
    this.logger.log(
      `   Nova data de vencimento: ${this.formatDate(data.newDueDate)}`,
    );
    this.logger.log(`   Renovações: ${data.renewalCount}/2`);
    this.logger.log('   ✅ Email "enviado" com sucesso!\n');

    await this.simulateDelay(100);
  }

  /**
   * Envia email de multa gerada
   */
  async sendFineNotification(data: {
    userEmail: string;
    userName: string;
    amount: number;
    reason: string;
  }): Promise<void> {
    this.logger.warn('💰 [EMAIL] Notificação de Multa');
    this.logger.log(`   Para: ${data.userEmail}`);
    this.logger.log(`   Nome: ${data.userName}`);
    this.logger.log(`   Valor: R$ ${data.amount.toFixed(2)}`);
    this.logger.log(`   Motivo: ${data.reason}`);
    this.logger.log('   ⚠️  Multas pendentes impedem novos empréstimos!');
    this.logger.log('   ✅ Email "enviado" com sucesso!\n');

    await this.simulateDelay(100);
  }

  /**
   * Formata data para exibição
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  /**
   * Simula delay de operação assíncrona
   */
  private async simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
