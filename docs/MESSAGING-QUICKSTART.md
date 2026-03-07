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

## 📊 Métricas de Sucesso

Se tudo estiver OK, você deve ver:

✅ RabbitMQ rodando na porta 5672  
✅ Management UI acessível em http://localhost:15672  
✅ Fila `library_queue` criada  
✅ Eventos sendo emitidos e recebidos  
✅ Logs de emails no console  
✅ Cronjob executando (se configurado)  

## 🎯 Próximo Passo

Explore a documentação completa em:
- [MESSAGING.md](./MESSAGING.md) - Teoria e conceitos
- [BUSINESS-DOMAIN.md](./BUSINESS-DOMAIN.md) - Regras de negócio

Experimente criar novos eventos e consumers!
