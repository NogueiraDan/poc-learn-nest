# 🐰 Mensageria com RabbitMQ - Sistema de Biblioteca

> **Documentação Técnica de Mensageria**  
> Este documento explica como o sistema utiliza RabbitMQ para processamento assíncrono e arquitetura orientada a eventos.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Por Que Mensageria?](#-por-que-mensageria)
- [RabbitMQ vs Kafka](#-rabbitmq-vs-kafka)
- [Arquitetura](#️-arquitetura)
- [Eventos Implementados](#-eventos-implementados)
- [Como Funciona](#-como-funciona)
- [Setup e Configuração](#️-setup-e-configuração)
- [Testando a Mensageria](#-testando-a-mensageria)
- [Monitoramento](#-monitoramento)
- [Casos de Uso](#-casos-de-uso)
- [Dead Letter Queue (DLQ)](#-dead-letter-queue-dlq)
- [Conceitos Aprendidos](#-conceitos-aprendidos)
- [Próximos Passos](#-próximos-passos)

---

## 🎯 Visão Geral

O sistema de biblioteca agora utiliza **RabbitMQ** como **message broker** para:

✅ **Notificações assíncronas** - Envio de emails sem bloquear resposta HTTP  
✅ **Event-Driven Architecture** - Módulos desacoplados se comunicam via eventos  
✅ **Scheduled Jobs** - Tarefas periódicas (verificação de empréstimos atrasados)  
✅ **Escalabilidade** - Múltiplos consumers podem processar em paralelo  
✅ **Resiliência** - RabbitMQ garante entrega de mensagens  

---

## 💡 Por Que Mensageria?

### **Problema Antes:**

```typescript
// ❌ Abordagem síncrona (bloqueante)
async createLoan(dto: CreateLoanDto) {
  const loan = await this.prisma.loan.create({ ... });
  
  // Bloqueando a resposta HTTP para enviar email
  await this.emailService.sendConfirmation(loan); // 2-3 segundos
  
  return loan; // Usuário espera email ser enviado
}
```

**Problemas:**
- ⏱️ Resposta HTTP lenta (+ 2-3 segundos)
- ❌ Se email falhar, empréstimo também falha
- 🔗 Acoplamento forte entre módulos

### **Solução Com Mensageria:**

```typescript
// ✅ Abordagem assíncrona (não bloqueante)
async createLoan(dto: CreateLoanDto) {
  const loan = await this.prisma.loan.create({ ... });
  
  // Apenas EMITE evento (não espera processamento)
  this.rabbitClient.emit('loan.created', { loanId: loan.id });
  
  return loan; // Resposta instantânea (< 100ms)
}
```

**Benefícios:**
- ⚡ Resposta HTTP rápida
- ✅ Email processado em background
- 🔓 Desacoplamento total
- 🔄 Fácil adicionar novos listeners

---

## 🆚 RabbitMQ vs Kafka

| Aspecto | RabbitMQ | Kafka |
|---------|----------|-------|
| **Tipo** | Message Broker | Event Streaming Platform |
| **Padrão** | Pub/Sub, Queues, RPC | Event Log, Streaming |
| **Complexidade** | ✅ Simples | ❌ Complexo |
| **Setup** | ✅ Fácil (Docker + 1 serviço) | ❌ Difícil (Zookeeper, configs) |
| **Performance** | ~20k msg/s | ~1M msg/s |
| **Retenção** | Mensagem consumida é deletada | Eventos persistem (days/months) |
| **Casos de Uso** | Filas de tarefas, notificações | Analytics, Event Sourcing |
| **Mercado Brasil** | ✅ Muito usado | ✅ Grandes empresas |
| **Curva Aprendizado** | ✅ Baixa | ❌ Alta |

### **Por Que RabbitMQ Neste Projeto?**

✅ **Curva de aprendizado menor** - Foco em aprender conceitos de mensageria  
✅ **Integração nativa NestJS** - `@nestjs/microservices` suporta RabbitMQ  
✅ **Setup simples** - Docker Compose + 10 linhas de código  
✅ **Suficiente para 90% dos casos** - Notificações, jobs, filas  

> 💡 **Dica:** Depois de dominar RabbitMQ, migrar para Kafka fica muito mais fácil!

---

## 🏗️ Arquitetura

### **Diagrama de Fluxo**

```
┌─────────────────────────────────────────────────────────────────┐
│                    APLICAÇÃO NESTJS                             │
│                                                                 │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │ LoansService │         │ Reservations │                     │
│  │              │         │   Service    │                     │
│  └──────┬───────┘         └──────┬───────┘                     │
│         │                        │                             │
│         │ emit('loan.created')   │ emit('reservation.confirmed')
│         ▼                        ▼                             │
│  ┌──────────────────────────────────────┐                      │
│  │      RabbitMQ Client (Producer)      │                      │
│  └──────────────┬───────────────────────┘                      │
│                 │                                              │
└─────────────────┼──────────────────────────────────────────────┘
                  │
                  │ AMQP Protocol
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     RABBITMQ SERVER                             │
│                                                                 │
│         ┌──────────────────────────┐                           │
│         │    library_queue         │  Fila: library_queue      │
│         │  ┌────────────────────┐  │  Durable: true            │
│         │  │ loan.created       │  │  Prefetch: 10             │
│         │  │ loan.returned      │  │                           │
│         │  │ loan.renewed       │  │                           │
│         │  │ loan.overdue       │  │                           │
│         │  │ reservation.con... │  │                           │
│         │  │ fine.created       │  │                           │
│         │  └────────────────────┘  │                           │
│         └──────────────────────────┘                           │
│                                                                 │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ Consumer
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                APLICAÇÃO NESTJS (CONSUMER)                      │
│                                                                 │
│  ┌──────────────────────────────────────┐                      │
│  │   NotificationsConsumer              │                      │
│  │  @EventPattern('loan.created')       │                      │
│  │  @EventPattern('loan.overdue')       │                      │
│  │  @EventPattern('reservation.conf')   │                      │
│  └──────────────┬───────────────────────┘                      │
│                 │                                              │
│                 ▼                                              │
│  ┌──────────────────────────────────────┐                      │
│  │       EmailService (Mock)            │                      │
│  │   sendLoanConfirmation()             │                      │
│  │   sendOverdueNotification()          │                      │
│  │   sendReservationConfirmed()         │                      │
│  └──────────────────────────────────────┘                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **Fluxo de Eventos**

1. **Produção**: `LoansService.create()` emite evento `loan.created`
2. **Roteamento**: RabbitMQ recebe e coloca na fila `library_queue`
3. **Consumo**: `NotificationsConsumer` escuta e processa
4. **Ação**: `EmailService` envia email ao usuário

---

## 📨 Eventos Implementados

### **1. Empréstimos (Loans)**

| Evento | Quando Emitido | Payload | Ação |
|--------|----------------|---------|------|
| `loan.created` | Empréstimo criado | loanId, userId, bookId, dueDate | Envia email de confirmação |
| `loan.returned` | Livro devolvido | loanId, returnDate, wasOverdue | Log (se multa, notifica em `fine.created`) |
| `loan.renewed` | Empréstimo renovado | loanId, newDueDate, renewalCount | Envia email de renovação |
| `loan.overdue` | Empréstimo atrasado | loanId, daysOverdue | Envia email de cobrança |

### **2. Reservas (Reservations)**

| Evento | Quando Emitido | Payload | Ação |
|--------|----------------|---------|------|
| `reservation.confirmed` | Livro disponível | reservationId, bookTitle, userId | Envia email "livro disponível" |

### **3. Multas (Fines)**

| Evento | Quando Emitido | Payload | Ação |
|--------|----------------|---------|------|
| `fine.created` | Multa gerada | fineId, amount, reason | Envia email com valor da multa |

---

## 🔧 Como Funciona

### **1. Producer (Emitir Evento)**

```typescript
// src/loans/loans.service.ts
import { ClientProxy } from '@nestjs/microservices';
import { MESSAGING_EVENTS, LoanCreatedEvent } from '../messaging';

export class LoansService {
  constructor(
    @Inject('RABBITMQ_SERVICE') private rabbitClient: ClientProxy,
  ) {}

  async create(dto: CreateLoanDto) {
    const loan = await this.prisma.loan.create({ ... });

    // 🔥 Emitir evento
    const event: LoanCreatedEvent = {
      loanId: loan.id,
      userId: loan.user.id,
      bookTitle: loan.book.title,
      userEmail: loan.user.email,
      dueDate: loan.dueDate,
    };
    
    this.rabbitClient.emit(MESSAGING_EVENTS.LOAN_CREATED, event);

    return loan;
  }
}
```

### **2. Consumer (Escutar Evento)**

```typescript
// src/notifications/notifications.consumer.ts
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class NotificationsConsumer {
  constructor(private emailService: EmailService) {}

  @EventPattern('loan.created')
  async handleLoanCreated(@Payload() data: LoanCreatedEvent) {
    await this.emailService.sendLoanConfirmation({
      userEmail: data.userEmail,
      bookTitle: data.bookTitle,
      dueDate: data.dueDate,
    });
  }
}
```

### **3. Scheduled Job (Cronjob)**

```typescript
// src/jobs/overdue-checker.service.ts
import { Cron, CronExpression } from '@nestjs/schedule';

export class OverdueCheckerService {
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkOverdueLoans() {
    const overdueLoans = await this.prisma.loan.findMany({
      where: {
        status: 'ACTIVE',
        dueDate: { lt: new Date() },
      },
    });

    for (const loan of overdueLoans) {
      // Emitir evento para cada empréstimo atrasado
      this.rabbitClient.emit('loan.overdue', {
        loanId: loan.id,
        daysOverdue: this.calculateDays(loan.dueDate),
      });
    }
  }
}
```

---

## ⚙️ Setup e Configuração

### **1. Instalar Dependências**

```bash
npm install @nestjs/microservices @nestjs/schedule amqplib amqp-connection-manager
```

### **2. Subir RabbitMQ (Docker)**

```bash
# docker-compose.yml já configurado
docker-compose up -d rabbitmq
```

### **3. Verificar RabbitMQ**

Acesse o **Management UI**:
- URL: http://localhost:15672
- User: `admin`
- Pass: `admin123`

### **4. Variável de Ambiente**

Adicione ao `.env`:

```env
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
```

### **5. Executar Aplicação**

```bash
npm run start:dev
```

No console você verá:

```
🐰 RabbitMQ Consumer conectado e ouvindo eventos...
🚀 Aplicação rodando em http://localhost:3000
```

---

## 🧪 Testando a Mensageria

### **Teste 1: Criar Empréstimo**

```bash
# 1. Fazer login
POST http://localhost:3000/v1/auth/login
{
  "email": "member@library.com",
  "password": "password123"
}

# 2. Criar empréstimo
POST http://localhost:3000/v1/loans
Authorization: Bearer {TOKEN}
{
  "userId": 3,
  "bookId": 1
}

# ✅ Verifique os logs do servidor:
# 📥 Evento recebido: loan.created
# 📧 [EMAIL] Confirmação de Empréstimo
#    Para: member@library.com
#    Livro: Clean Code
#    ✅ Email "enviado" com sucesso!
```

### **Teste 2: Devolver com Atraso**

```bash
# Simular devolução atrasada
PATCH http://localhost:3000/v1/loans/1/return

# ✅ Verifique os logs:
# 📥 Evento recebido: loan.returned
# 📥 Evento recebido: fine.created
# 💰 [EMAIL] Notificação de Multa
#    Valor: R$ 14.00
#    Motivo: Atraso de 7 dias
```

### **Teste 3: Verificar Cronjob Manualmente**

Para testar sem esperar meia-noite, altere temporariamente:

```typescript
// src/jobs/overdue-checker.service.ts
@Cron(CronExpression.EVERY_10_SECONDS) // Teste: a cada 10s
async checkOverdueLoans() { ... }
```

---

## 📊 Monitoramento

### **1. RabbitMQ Management UI**

Acesse: http://localhost:15672

**Informações disponíveis:**
- 📊 Mensagens na fila (`library_queue`)
- ⚡ Taxa de mensagens por segundo
- 🔁 Mensagens processadas vs pendentes
- ❌ Dead letter queue (mensagens com erro)

### **2. Logs da Aplicação**

```bash
# Ver logs em tempo real
npm run start:dev

# Filtrar apenas eventos de mensageria
npm run start:dev | grep "📥 Evento recebido"
```

---

## 💡 Casos de Uso

### **1. Notificações por Email**

**Implementado:**
- ✅ Confirmação de empréstimo
- ✅ Lembrete de vencimento (via cronjob)
- ✅ Notificação de atraso
- ✅ Reserva confirmada
- ✅ Multa gerada

### **2. Processamento em Background**

**Implementado:**
- ✅ Cronjob diário verifica empréstimos atrasados
- ✅ Atualiza status ACTIVE → OVERDUE
- ✅ Emite eventos de cobrança

### **3. Event-Driven Updates**

**Futuros:**
- Dashboard em tempo real (WebSockets)
- Analytics e relatórios
- Integração com sistemas externos

---

## 🎓 Conceitos Aprendidos

### **Mensageria**

✅ **Message Broker** - RabbitMQ como intermediário  
✅ **Producer/Consumer Pattern** - Emissor e receptor  
✅ **Event-Driven Architecture** - Desacoplamento via eventos  
✅ **Async Processing** - Tarefas em background  
✅ **AMQP Protocol** - Advanced Message Queuing Protocol  
✅ **Dead Letter Queue (DLQ)** - Tratamento de mensagens com falha  
✅ **Retry with Exponential Backoff** - Retentativas inteligentes  

### **NestJS**

✅ **@nestjs/microservices** - Integração com RabbitMQ  
✅ **ClientProxy** - Cliente para emitir mensagens  
✅ **@EventPattern** - Decorator para escutar eventos  
✅ **@Payload** - Extração de dados do evento  
✅ **@Ctx (RmqContext)** - Acesso ao contexto RabbitMQ  
✅ **Manual ACK/NACK** - Controle de confirmação de mensagens  

### **Scheduled Jobs**

✅ **@nestjs/schedule** - Cronjobs no NestJS  
✅ **Cron Expressions** - Agendamento de tarefas  
✅ **Background Workers** - Processos periódicos  

### **Design Patterns**

✅ **Observer Pattern** - Listeners reagem a eventos  
✅ **Publish/Subscribe** - Um produtor, múltiplos consumidores  
✅ **Queue Pattern** - Fila de processamento  
✅ **Circuit Breaker** - Proteção contra falhas em cascata  
✅ **Monitoring Pattern** - Rastreamento de falhas e alertas  

---

## 💀 Dead Letter Queue (DLQ)

### **O que é DLQ?**

Uma **Dead Letter Queue** é uma fila especial que recebe mensagens que **falharam após múltiplas tentativas**. É um padrão essencial para sistemas de produção.

### **Fluxo de Processamento com DLQ**

```
1. Mensagem chega na fila principal
2. Consumer tenta processar
   ├─ ✅ Sucesso → ACK (confirma)
   └─ ❌ Erro → NACK com requeue
3. Retry com exponential backoff
   ├─ Tentativa 1: espera 1 segundo
   ├─ Tentativa 2: espera 2 segundos
   ├─ Tentativa 3: espera 4 segundos
   └─ Tentativa 4: espera 8 segundos
4. Se todas tentativas falharem
   └─ NACK sem requeue → vai para DLQ
5. DLQ Consumer processa mensagem morta
   └─ Logs, alertas, análise manual
```

### **Configuração**

A DLQ foi configurada no `MessagingModule`:

```typescript
// MessagingModule
{
  transport: Transport.RMQ,
  options: {
    urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
    queue: 'library_notifications',
    noAck: false, // ⚠️ Manual ACK/NACK
    queueOptions: {
      durable: true,
      deadLetterExchange: 'library.dlx',      // ← Exchange para DLQ
      deadLetterRoutingKey: 'library.dead',   // ← Routing key
      messageTtl: 86400000,                   // ← 24h TTL
    },
  },
}
```

### **Estratégia de Retry**

O `NotificationsConsumer` implementa retry com backoff exponencial:

```typescript
// NotificationsConsumer
private readonly MAX_RETRIES = 3;

async processWithRetry<T>(
  eventName: string,
  payload: T,
  context: RmqContext,
  processor: (data: T) => Promise<void>,
) {
  const channel = context.getChannelRef();
  const originalMsg = context.getMessage();
  const retryCount = originalMsg.properties.headers?.['x-retry-count'] || 0;

  try {
    // Tentar processar
    await processor(payload);
    
    // ✅ Sucesso → ACK
    channel.ack(originalMsg);
    
    if (retryCount > 0) {
      this.failureMonitor.recordRetrySuccess(eventName, retryCount);
    }
  } catch (error) {
    if (retryCount < this.MAX_RETRIES) {
      // 🔁 Retry → NACK com requeue
      const delay = Math.pow(2, retryCount) * 1000;
      channel.nack(originalMsg, false, true);
      headers['x-retry-count'] = retryCount + 1;
    } else {
      // 💀 Esgotou tentativas → envia para DLQ
      headers['x-original-event'] = eventName;
      headers['x-first-death-time'] = new Date().toISOString();
      channel.nack(originalMsg, false, false); // ← false = sem requeue
    }
  }
}
```

### **Dead Letter Consumer**

O `DeadLetterConsumer` processa mensagens que chegam na DLQ:

```typescript
@Controller()
export class DeadLetterConsumer {
  @EventPattern('library.dead')
  async handleDeadLetter(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const headers = originalMsg.properties.headers || {};

    // Extrair informações da morte
    const originalEvent = headers['x-original-event'];
    const firstDeathTime = headers['x-first-death-time'];
    const deathReason = headers['x-first-death-reason'];
    const deathQueue = headers['x-first-death-queue'];

    // Log detalhado
    this.logger.error(
      `💀 DEAD LETTER QUEUE - Mensagem morta recebida:
       Evento original: ${originalEvent}
       Primeira morte: ${firstDeathTime}
       Motivo: ${deathReason}
       Fila origem: ${deathQueue}
       Payload: ${JSON.stringify(data)}`,
    );

    // Registrar no sistema de monitoramento
    this.failureMonitor.recordDeadLetter(originalEvent, data);

    // ⚠️ SEMPRE fazer ACK na DLQ para não criar loop infinito
    channel.ack(originalMsg);

    // Em produção, você faria:
    // - Enviar alerta crítico para Sentry
    // - Criar ticket no Jira
    // - Salvar em tabela de erros
    // - Notificar equipe de ops
  }
}
```

### **Monitoramento de Falhas**

O `FailureMonitorService` rastreia falhas e gera alertas:

```typescript
export class FailureMonitorService {
  private failureMap = new Map<string, FailureRecord[]>();
  private readonly ALERT_THRESHOLD = 5; // Alerta após 5 falhas

  recordFailure(eventName: string, error: Error, payload: any, retryCount: number) {
    // Adicionar falha ao histórico
    const failures = this.failureMap.get(eventName) || [];
    failures.push({
      timestamp: new Date(),
      error: error.message,
      payload,
      retryCount,
    });
    this.failureMap.set(eventName, failures);

    // Verificar threshold
    if (failures.length >= this.ALERT_THRESHOLD) {
      this.logger.error(
        `🚨 ALERTA: ${eventName} falhou ${failures.length} vezes recentemente!`,
      );
    }
  }

  recordDeadLetter(eventName: string, payload: any) {
    this.logger.error(
      `💀 ALERTA CRÍTICO: Mensagem em DLQ para evento ${eventName}`,
    );
  }

  getStats(): Map<string, FailureRecord[]> {
    return this.failureMap;
  }
}
```

### **Testando DLQ**

Para testar a DLQ, você pode simular falhas no consumer:

```typescript
// EmailService - simular falha
async sendLoanConfirmation(data) {
  // Forçar erro para testar DLQ
  throw new Error('ERRO INTENCIONAL PARA TESTAR DLQ');
}
```

**O que vai acontecer:**

1. **Tentativa 1**: Falha → aguarda 1s → retry
2. **Tentativa 2**: Falha → aguarda 2s → retry
3. **Tentativa 3**: Falha → aguarda 4s → retry
4. **Tentativa 4**: Falha → aguarda 8s → retry
5. **Após 4 tentativas**: Mensagem vai para DLQ
6. **DeadLetterConsumer**: Processa e loga erro crítico

### **RabbitMQ Management UI**

Acompanhe as mensagens na UI:

1. Acesse: http://localhost:15672
2. Login: `guest` / `guest`
3. Vá em **Queues**:
   - `library_notifications` - Fila principal
   - `library.dead` - Dead Letter Queue
4. Observe:
   - **Ready**: Mensagens aguardando processamento
   - **Unacked**: Mensagens em processamento
   - **Total**: Total de mensagens

### **Boas Práticas DLQ**

✅ **Sempre faça ACK na DLQ** - Evite loops infinitos  
✅ **Log com contexto completo** - Headers, payload, timestamp  
✅ **Alerta crítico** - Notifique equipe imediatamente  
✅ **TTL adequado** - Mensagens não devem ficar eternamente na DLQ  
✅ **Análise manual** - Mensagens na DLQ precisam de investigação  
✅ **Idempotência** - Processar mesma mensagem 2x não deve causar problemas  

---

## 🚀 Próximos Passos

### **Melhorias Imediatas**

1. **Email Service Real**
   - Integrar com SendGrid / NodeMailer
   - Templates HTML bonitos
   - Tracking de envio

2. **Testes**
   - Unit tests mockando RabbitMQ
   - Integration tests com RabbitMQ de teste
   - E2E tests verificando fluxo completo

### **Features Avançadas**

4. **Redis para Caching**
   - Cache de livros populares
   - Session storage
   - Rate limiting distribuído

5. **Kafka para Analytics**
   - Event streaming
   - Análise de comportamento
   - Data lake

6. **WebSockets**
   - Notificações em tempo real no frontend
   - Dashboard live

---

## 📚 Recursos de Estudo

### **Documentação Oficial**

- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)
- [AMQP Protocol](https://www.amqp.org/)

### **Cursos Recomendados**

- NestJS - The Complete Developer's Guide (Udemy)
- Microservices with Node JS and React (Udemy)
- RabbitMQ in Depth (Pluralsight)

---

## 🎯 Conclusão

A implementação de mensageria com RabbitMQ adiciona:

✅ **Escalabilidade** - Sistema pode crescer sem refatoração  
✅ **Resiliência** - Falhas isoladas não afetam toda aplicação  
✅ **Performance** - Respostas HTTP mais rápidas  
✅ **Manutenibilidade** - Código desacoplado e testável  
✅ **Empregabilidade** - Skill muito valorizada no mercado  

Este projeto agora demonstra **arquitetura enterprise-ready** com boas práticas de desenvolvimento moderno! 🚀
