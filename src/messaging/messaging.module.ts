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
 *
 * Por que usar mensageria?
 * - Desacoplar serviços (não bloqueia resposta HTTP)
 * - Processamento assíncrono (ex: enviar emails)
 * - Escalabilidade (múltiplos consumers)
 * - Resiliência (retry automático em caso de falha)
 */
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672'],
          queue: 'library_queue',
          queueOptions: {
            durable: true, // Fila persiste reinicializações do RabbitMQ
          },
          // Prefetch: quantas mensagens um consumer pode processar simultaneamente
          prefetchCount: 10,
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class MessagingModule {}
