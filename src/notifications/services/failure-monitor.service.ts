import { Injectable, Logger } from '@nestjs/common';

/**
 * FailureMonitorService
 *
 * Conceitos:
 * - Monitoring: Monitoramento de falhas em mensageria
 * - Alerting: Alertas para equipe de operações
 * - Metrics: Coleta de métricas de falhas
 *
 * Responsabilidades:
 * - Registrar falhas de processamento
 * - Rastrear padrões de erro
 * - Alertar equipe quando threshold é atingido
 * - Fornecer dados para análise
 *
 * Em produção:
 * - Integrar com Sentry, Datadog, New Relic
 * - Enviar alertas via Slack, PagerDuty
 * - Criar dashboards de monitoramento
 */
@Injectable()
export class FailureMonitorService {
  private readonly logger = new Logger(FailureMonitorService.name);
  private failureCount = 0;
  private failuresByEvent = new Map<string, number>();
  private readonly ALERT_THRESHOLD = 5; // Alerta após 5 falhas

  /**
   * Registra falha de processamento
   */
  recordFailure(
    eventName: string,
    error: Error,
    payload: any,
    attempt: number,
  ): void {
    this.failureCount++;

    const currentCount = this.failuresByEvent.get(eventName) || 0;
    this.failuresByEvent.set(eventName, currentCount + 1);

    this.logger.error(
      `❌ [FALHA] Evento: ${eventName} | Tentativa: ${attempt}`,
    );
    this.logger.error(`   Erro: ${error.message}`);
    this.logger.debug(`   Payload: ${JSON.stringify(payload)}`);
    this.logger.debug(`   Stack: ${error.stack}`);

    // Verificar se precisa alertar
    if (currentCount + 1 >= this.ALERT_THRESHOLD) {
      this.sendAlert(eventName, currentCount + 1);
    }
  }

  /**
   * Registra sucesso após retry
   */
  recordRetrySuccess(eventName: string, attempt: number): void {
    this.logger.log(
      `✅ [RETRY SUCCESS] Evento: ${eventName} processado na tentativa ${attempt}`,
    );
  }

  /**
   * Registra quando mensagem vai para DLQ
   */
  recordDeadLetter(eventName: string, payload: any, finalError: Error): void {
    this.logger.error(
      `💀 [DEAD LETTER] Evento: ${eventName} movido para DLQ após múltiplas falhas`,
    );
    this.logger.error(`   Último erro: ${finalError.message}`);
    this.logger.error(`   Payload: ${JSON.stringify(payload)}`);

    // Em produção: salvar no banco para análise posterior
    // await this.prisma.deadLetterLog.create({ ... });

    // Alertar sempre que algo vai para DLQ
    this.sendCriticalAlert(eventName);
  }

  /**
   * Envia alerta para equipe (simulado)
   */
  private sendAlert(eventName: string, failureCount: number): void {
    this.logger.warn(
      `\n⚠️  [ALERTA] Evento "${eventName}" falhou ${failureCount} vezes!`,
    );
    this.logger.warn(
      `   Ação recomendada: Verificar logs e investigar causa raiz\n`,
    );

    // Em produção:
    // - Enviar para Slack: await this.slackService.sendAlert(...)
    // - Criar ticket: await this.jiraService.createTicket(...)
    // - Enviar email: await this.emailService.alertOps(...)
  }

  /**
   * Envia alerta crítico (DLQ)
   */
  private sendCriticalAlert(eventName: string): void {
    this.logger.error(
      `\n🚨 [ALERTA CRÍTICO] Mensagem do evento "${eventName}" foi para DLQ!`,
    );
    this.logger.error(
      `   Ação URGENTE: Investigar e reprocessar manualmente\n`,
    );

    // Em produção:
    // - PagerDuty incident
    // - Slack com @channel
    // - SMS para on-call engineer
  }

  /**
   * Obtém estatísticas de falhas
   */
  getStats(): {
    totalFailures: number;
    failuresByEvent: Record<string, number>;
  } {
    return {
      totalFailures: this.failureCount,
      failuresByEvent: Object.fromEntries(this.failuresByEvent),
    };
  }

  /**
   * Reseta estatísticas (útil para testes)
   */
  resetStats(): void {
    this.failureCount = 0;
    this.failuresByEvent.clear();
    this.logger.log('📊 Estatísticas de falhas resetadas');
  }
}
