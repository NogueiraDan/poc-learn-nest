import { Module } from '@nestjs/common';
import { NotificationsConsumer } from './notifications.consumer';
import { EmailService } from './services/email.service';

/**
 * NotificationsModule
 *
 * Responsabilidades:
 * - Escutar eventos de mensageria (RabbitMQ)
 * - Processar notificações assíncronas
 * - Enviar emails (mock)
 *
 * Arquitetura:
 * - NotificationsConsumer: Escuta eventos do RabbitMQ
 * - EmailService: Processa envio de emails
 *
 * Conceitos:
 * - Consumer: Consome mensagens de uma fila
 * - Event-Driven: Reage a eventos emitidos por outros módulos
 * - Separation of Concerns: Notificações separadas da lógica de negócio
 */
@Module({
  controllers: [NotificationsConsumer],
  providers: [EmailService],
  exports: [EmailService],
})
export class NotificationsModule {}
