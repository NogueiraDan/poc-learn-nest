import { Module } from '@nestjs/common';
import { NotificationsConsumer } from './notifications.consumer';
import { DeadLetterConsumer } from './dead-letter.consumer';
import { EmailService } from './services/email.service';
import { FailureMonitorService } from './services/failure-monitor.service';

/**
 * NotificationsModule
 *
 * Responsabilidades:
 * - Escutar eventos de mensageria (RabbitMQ)
 * - Processar notificações assíncronas
 * - Enviar emails (mock)
 * - Monitorar falhas e retries
 * - Processar Dead Letter Queue (DLQ)
 *
 * Arquitetura:
 * - NotificationsConsumer: Escuta eventos do RabbitMQ com retry
 * - DeadLetterConsumer: Processa mensagens que falharam após retries
 * - EmailService: Processa envio de emails
 * - FailureMonitorService: Rastreia falhas e gera alertas
 *
 * Conceitos:
 * - Consumer: Consome mensagens de uma fila
 * - Event-Driven: Reage a eventos emitidos por outros módulos
 * - Dead Letter Queue: Captura mensagens que falharam
 * - Retry with Backoff: Retenta processamento com delay exponencial
 * - Separation of Concerns: Notificações separadas da lógica de negócio
 */
@Module({
  controllers: [NotificationsConsumer, DeadLetterConsumer],
  providers: [EmailService, FailureMonitorService],
  exports: [EmailService, FailureMonitorService],
})
export class NotificationsModule {}
