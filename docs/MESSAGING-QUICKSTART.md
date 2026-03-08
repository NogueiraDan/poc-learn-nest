# 🚀 Quick Start - Testando Mensageria

## ✅ Pré-requisitos

1. RabbitMQ rodando:
```bash
docker-compose up -d rabbitmq
```

2. Verificar se está OK:
```bash
docker ps | findstr rabbitmq
# Deve mostrar: Up X seconds (healthy)
```

3. Acessar Management UI:
- URL: http://localhost:15672
- User: `admin`
- Pass: `admin123`

## 🧪 Testando os Eventos

### 1. Iniciar Aplicação

```bash
npm run start:dev
```

Você verá no console:
```
🐰 RabbitMQ Consumer conectado e ouvindo eventos...
🚀 Aplicação rodando em http://localhost:3000
```

### 2. Criar Empréstimo (Testa evento `loan.created`)

```bash
# Fazer login primeiro
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "member@library.com",
    "password": "password123"
  }'

# Copiar o accessToken da resposta

# Criar empréstimo
curl -X POST http://localhost:3000/v1/loans \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 3,
    "bookId": 1
  }'
```

**Verifique os logs do servidor:**

```
📥 Evento recebido: loan.created
📧 [EMAIL] Confirmação de Empréstimo
   Para: member@library.com
   Nome: Member User
   Livro: Clean Code
   Vencimento: 20/03/2026
   ✅ Email "enviado" com sucesso!
```

### 3. Devolver Livro (Testa evento `loan.returned`)

```bash
curl -X PATCH http://localhost:3000/v1/loans/1/return \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 4. Testar Cronjob (Empréstimos Atrasados)

Para testar sem esperar meia-noite:

**Opção A: Alterar temporariamente o cronjob**

Edite `src/jobs/overdue-checker.service.ts`:

```typescript
// Linha ~39: Altere de EVERY_DAY_AT_MIDNIGHT para EVERY_10_SECONDS
@Cron(CronExpression.EVERY_10_SECONDS, {
  name: 'check-overdue-loans',
  timeZone: 'America/Sao_Paulo',
})
```

Reinicie a aplicação e aguarde 10 segundos. Você verá:

```
🔍 [CRONJOB] Iniciando verificação de empréstimos atrasados...
   📊 2 empréstimo(s) atrasado(s) encontrado(s)
   ⚠️  Loan #5 - Clean Code - 7 dias de atraso
   📤 Evento emitido: loan.overdue
📥 Evento recebido: loan.overdue
🚨 [EMAIL] Notificação de Atraso
   Para: member@library.com
   Livro: Clean Code
   Dias de atraso: 7
```

**Opção B: Criar endpoint de teste (Recomendado)**

Adicione um controller temporário para testar:

```typescript
// src/jobs/jobs.controller.ts (CRIAR NOVO ARQUIVO)
import { Controller, Post, UseGuards } from '@nestjs/common';
import { OverdueCheckerService } from './overdue-checker.service';
import { Roles } from '../auth/decorators';

@Controller('jobs')
export class JobsController {
  constructor(private overdueChecker: OverdueCheckerService) {}

  @Post('check-overdue')
  @Roles('ADMIN') // Apenas admin pode disparar
  async triggerOverdueCheck() {
    await this.overdueChecker.checkOverdueLoansManual();
    return { message: 'Cronjob executado manualmente' };
  }
}
```

Depois teste com:

```bash
curl -X POST http://localhost:3000/v1/jobs/check-overdue \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 5. Monitorar RabbitMQ

Acesse: http://localhost:15672

- Vá em **Queues** → `library_queue`
- Veja número de mensagens processadas
- Veja taxa de mensagens/segundo
- Veja gráficos de throughput

## 🐛 Troubleshooting

### RabbitMQ não conecta

```bash
# Verificar se está rodando
docker ps | findstr rabbitmq

# Ver logs
docker logs poc-learn-nest-rabbitmq

# Reiniciar
docker-compose restart rabbitmq
```

### Eventos não são recebidos

1. Verifique se `startAllMicroservices()` está sendo chamado no `main.ts`
2. Verifique se os módulos estão importados no `app.module.ts`
3. Verifique os logs do RabbitMQ no Management UI

### Emails não aparecem

O `EmailService` é um **mock** - apenas loga no console. Verifique os logs da aplicação.

---

## 💀 Testando Dead Letter Queue (DLQ)

### **Passo 1: Simular Falha no Consumer**

Edite `src/notifications/services/email.service.ts`:

```typescript
async sendLoanConfirmation(data: {
  userEmail: string;
  userName: string;
  bookTitle: string;
  dueDate: Date;
}): Promise<void> {
  // ⚠️ ERRO INTENCIONAL PARA TESTAR DLQ
  throw new Error('FALHA SIMULADA PARA TESTE DE DLQ');
  
  this.logger.log(`
    📧 ========== EMAIL ENVIADO ==========
    Para: ${data.userEmail}
    ...
  `);
}
```

### **Passo 2: Criar um Empréstimo**

```bash
curl -X POST http://localhost:3000/loans \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "uuid-do-usuario",
    "bookId": "uuid-do-livro"
  }'
```

### **Passo 3: Observar Retries nos Logs**

Você verá:

```
[NotificationsConsumer] 📥 Evento recebido: loan.created
[NotificationsConsumer] ❌ Erro ao processar loan.created: FALHA SIMULADA PARA TESTE DE DLQ
[NotificationsConsumer] 🔁 Tentativa 1/3 falhou. Reagendando em 1000ms...

[NotificationsConsumer] 📥 Evento recebido: loan.created
[NotificationsConsumer] ❌ Erro ao processar loan.created: FALHA SIMULADA PARA TESTE DE DLQ
[NotificationsConsumer] 🔁 Tentativa 2/3 falhou. Reagendando em 2000ms...

[NotificationsConsumer] 📥 Evento recebido: loan.created
[NotificationsConsumer] ❌ Erro ao processar loan.created: FALHA SIMULADA PARA TESTE DE DLQ
[NotificationsConsumer] 🔁 Tentativa 3/3 falhou. Reagendando em 4000ms...

[NotificationsConsumer] 📥 Evento recebido: loan.created
[NotificationsConsumer] ❌ Erro ao processar loan.created: FALHA SIMULADA PARA TESTE DE DLQ
[NotificationsConsumer] 💀 Mensagem loan.created esgotou 3 tentativas. Enviando para DLQ...
```

### **Passo 4: Ver Mensagem na DLQ**

```
[DeadLetterConsumer] 💀 DEAD LETTER QUEUE - Mensagem morta recebida:
   Evento original: loan.created
   Primeira morte: 2025-02-20T12:34:56.789Z
   Motivo: rejected
   Fila origem: library_notifications
   Payload: {"loanId": "...", "userEmail": "..."}

[FailureMonitorService] 💀 ALERTA CRÍTICO: Mensagem em DLQ para evento loan.created
```

### **Passo 5: Verificar no RabbitMQ Management**

1. Acesse: http://localhost:15672
2. Vá em **Queues**
3. Procure pela fila `library.dead` (Dead Letter Queue)
4. Veja as mensagens que falharam

**Você verá:**
- **library_notifications** - Fila principal (vazia após processar)
- **library.dead** - DLQ com a mensagem que falhou

### **Passo 6: Restaurar o Código**

Remova o erro simulado:

```typescript
async sendLoanConfirmation(data: ...): Promise<void> {
  // Remover a linha do throw
  this.logger.log(`
    📧 ========== EMAIL ENVIADO ==========
    ...
  `);
}
```

### **Passo 7: Testando Sucesso Após Retry**

Para testar uma falha que se recupera:

```typescript
private failureCount = 0;

async sendLoanConfirmation(data: ...): Promise<void> {
  // Falhar nas primeiras 2 tentativas, sucesso na 3ª
  this.failureCount++;
  if (this.failureCount <= 2) {
    throw new Error(`Falha simulada ${this.failureCount}/2`);
  }
  
  this.logger.log(`
    📧 ========== EMAIL ENVIADO (após ${this.failureCount} tentativas) ==========
    ...
  `);
  
  this.failureCount = 0; // Reset para próxima mensagem
}
```

**Resultado esperado:**
```
[NotificationsConsumer] 🔁 Tentativa 1/3 falhou. Reagendando...
[NotificationsConsumer] 🔁 Tentativa 2/3 falhou. Reagendando...
[NotificationsConsumer] ✅ Email de confirmação enviado (após retry)
[FailureMonitorService] ✅ Sucesso após 2 retries para evento loan.created
```

### **Métricas de DLQ**

Para ver estatísticas de falhas:

```typescript
// Em algum endpoint ou cronjob
const stats = this.failureMonitor.getStats();
console.log(stats);
```

**Output:**
```json
{
  "loan.created": [
    {
      "timestamp": "2025-02-20T12:34:56.789Z",
      "error": "FALHA SIMULADA PARA TESTE DE DLQ",
      "retryCount": 1
    }
  ]
}
```

---

## 📊 Métricas de Sucesso

Se tudo estiver OK, você deve ver:

✅ RabbitMQ rodando na porta 5672  
✅ Management UI acessível em http://localhost:15672  
✅ Fila `library_notifications` criada  
✅ Fila `library.dead` (DLQ) criada  
✅ Eventos sendo emitidos e recebidos  
✅ Retries automáticos com backoff exponencial  
✅ Mensagens falhadas indo para DLQ  
✅ Alertas de falhas no console  
✅ Logs de emails no console  
✅ Cronjob executando (se configurado)  

## 🎯 Próximo Passo

Explore a documentação completa em:
- [MESSAGING.md](./MESSAGING.md) - Teoria e conceitos
- [BUSINESS-DOMAIN.md](./BUSINESS-DOMAIN.md) - Regras de negócio

Experimente criar novos eventos e consumers!
