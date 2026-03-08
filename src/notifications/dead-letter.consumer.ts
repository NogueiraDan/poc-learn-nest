import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { FailureMonitorService } from './services/failure-monitor.service';

/**
 * DeadLetterConsumer
 *
 * Conceitos:
 * - Dead Letter Queue (DLQ): Fila para mensagens que falharam repetidamente
 * - Message Acknowledgment: Confirmar ou rejeitar mensagens
 * - Error Handling: Tratamento robusto de erros
 *
 * Quando uma mensagem vai para DLQ?
 * 1. Falhou após MAX_RETRIES tentativas
 * 2. TTL expirou (24h sem ser processada)
 * 3. Consumer rejeitou explicitamente
 *
 * O que fazer com mensagens na DLQ?
 * 1. Logar detalhes para investigação
 * 2. Alertar equipe de operações
 * 3. Salvar em banco para análise
 * 4. Possibilitar reprocessamento manual
 *
 * Em produção:
 * - Criar dashboard de DLQ
 * - Endpoint para reprocessar mensagens
 * - Integração com sistema de tickets
 */
@Controller()
export class DeadLetterConsumer {
  private readonly logger = new Logger(DeadLetterConsumer.name);

  constructor(private readonly failureMonitor: FailureMonitorService) {}

  /**
   * Escuta mensagens da Dead Letter Queue
   *
   * IMPORTANTE: Este consumer NÃO deve falhar!
   * Se falhar, a mensagem pode ser perdida definitivamente.
   */
  @EventPattern('library.dead_letter')
  async handleDeadLetter(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    this.logger.error('\n💀 ========================================');
    this.logger.error('🚨 MENSAGEM NA DEAD LETTER QUEUE');
    this.logger.error('=========================================');

    try {
      // Extrair informações do headers da mensagem
      const properties = (originalMsg as any).properties;
      const headers = properties?.headers || {};

      this.logger.error(
        `📩 Evento original: ${headers['x-original-event'] || 'desconhecido'}`,
      );
      this.logger.error(
        `🔁 Tentativas: ${headers['x-death']?.[0]?.count || 'N/A'}`,
      );
      this.logger.error(
        `⏰ Primeira falha: ${headers['x-first-death-time'] || 'N/A'}`,
      );
      this.logger.error(`📦 Payload: ${JSON.stringify(data, null, 2)}`);
      this.logger.error(`📊 Headers: ${JSON.stringify(headers, null, 2)}`);

      // Registrar no monitor de falhas
      this.failureMonitor.recordDeadLetter(
        headers['x-original-event'] || 'unknown',
        data,
        new Error('Mensagem enviada para DLQ'),
      );

      // Em produção, você poderia:
      // 1. Salvar no banco de dados
      // await this.prisma.deadLetterMessage.create({
      //   data: {
      //     event: headers['x-original-event'],
      //     payload: JSON.stringify(data),
      //     retryCount: headers['x-death']?.[0]?.count,
      //     error: 'Multiple failures',
      //     timestamp: new Date(),
      //   },
      // });

      // 2. Enviar para sistema de monitoramento
      // await this.sentryService.captureDeadLetter(data);

      // 3. Criar ticket automático
      // await this.jiraService.createTicket({
      //   title: `DLQ: ${headers['x-original-event']}`,
      //   description: JSON.stringify(data),
      //   priority: 'HIGH',
      // });

      // 4. Tentar ação de fallback
      // Por exemplo, se falhou enviar email, salvar para envio manual depois
      if (headers['x-original-event']?.includes('loan.created')) {
        this.logger.warn(
          '   💡 Sugestão: Enviar email manualmente para o usuário',
        );
        // await this.saveForManualProcessing(data);
      }

      this.logger.error('=========================================\n');

      // SEMPRE confirmar (ACK) mensagens da DLQ
      // Se não confirmar, RabbitMQ vai tentar entregar novamente infinitamente
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error('❌ Erro ao processar mensagem da DLQ:', error);

      // Mesmo com erro, confirmar (ACK) para não travar a fila
      // Isso é controverso, mas previne loop infinito
      channel.ack(originalMsg);

      // Log do erro para investigação
      this.logger.error(`   Stack: ${error.stack}`);
    }
  }

  /**
   * Endpoint para estatísticas de DLQ
   * (poderia ser exposto via HTTP controller)
   */
  getDeadLetterStats() {
    return this.failureMonitor.getStats();
  }
}
