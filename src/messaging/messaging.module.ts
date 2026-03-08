import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

/**
 * MessagingModule
 *
 * Conceitos:
 * - Message Broker: RabbitMQ como intermediário para comunicação assíncrona
 * - Producer/Consumer: Padrão de mensageria onde um produz e outro consome
 * - Queue: Fila de mensagens com garantia de entrega
 * - AMQP: Advanced Message Queuing Protocol
 * - Dead Letter Queue (DLQ): Fila para mensagens que falharam após múltiplas tentativas
 *
 * Por que usar mensageria?
 * - Desacoplar serviços (não bloqueia resposta HTTP)
 * - Processamento assíncrono (ex: enviar emails)
 * - Escalabilidade (múltiplos consumers)
 * - Resiliência (retry automático em caso de falha)
 *
 * Dead Letter Queue:
 * - Captura mensagens que falharam após N tentativas
 * - Previne perda de dados
 * - Permite análise e reprocessamento manual
 * - Alerta equipe sobre problemas sistemáticos
 */
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [
            process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672',
          ],
          queue: 'library_queue',
          queueOptions: {
            durable: true, // Fila persiste reinicializações do RabbitMQ
            // Dead Letter Exchange - Para onde vão mensagens rejeitadas
            deadLetterExchange: 'library.dlx',
            deadLetterRoutingKey: 'library.dead_letter',
            // Message TTL: 24 horas (após isso, vai para DLQ se não processado)
            messageTtl: 86400000, // 24h em ms
          },
          // Prefetch: quantas mensagens um consumer pode processar simultaneamente
          prefetchCount: 10,
          // Reconnect automaticamente se conexão cair
          noAck: false, // Requer confirmação manual (mais seguro)
          persistent: true, // Mensagens sobrevivem reinicialização do broker
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class MessagingModule {}
