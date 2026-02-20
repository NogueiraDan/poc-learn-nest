# 🎓 Roteiro Completo de Aprendizado - NestJS
## POC: Sistema de Gerenciamento de Biblioteca

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Conceitos que Serão Cobertos](#conceitos-cobertos)
3. [Domínio de Negócio](#domínio-de-negócio)
4. [Fases do Projeto](#fases-do-projeto)
5. [Estrutura Final do Projeto](#estrutura-final)

---

## 🎯 Visão Geral

Este projeto POC foi criado para aprender **TODOS** os conceitos essenciais do NestJS de forma prática e progressiva. Cada fase adiciona novos conceitos, permitindo um aprendizado incremental e consolidado.

**Objetivo:** Capacitar você a desenvolver projetos NestJS completos do zero, com conhecimento sólido de todos os recursos e padrões do framework.

---

## 📚 Conceitos Cobertos

### 1. **Fundamentos Core**
- ✅ Módulos (Modules)
- ✅ Controladores (Controllers)
- ✅ Provedores e Serviços (Providers/Services)
- ✅ Injeção de Dependência (Dependency Injection)
- ✅ Decorators (@Injectable, @Controller, etc.)
- ✅ Estrutura de pastas e organização

### 2. **Banco de Dados e Persistência**
- ✅ Integração com Prisma ORM
- ✅ Entidades e Modelos
- ✅ Relacionamentos (1:1, 1:N, N:N)
- ✅ Migrations
- ✅ Repository Pattern
- ✅ Transactions

### 3. **Validação e Transformação**
- ✅ DTOs (Data Transfer Objects)
- ✅ Class Validator
- ✅ Class Transformer
- ✅ Pipes (ValidationPipe, ParseIntPipe, etc.)
- ✅ Custom Pipes

### 4. **Autenticação e Autorização**
- ✅ JWT (JSON Web Tokens)
- ✅ Passport Strategy
- ✅ Guards (AuthGuard, RolesGuard)
- ✅ Role-Based Access Control (RBAC)
- ✅ Refresh Tokens
- ✅ Password Hashing (bcrypt)

### 5. **Recursos Avançados**
- ✅ Interceptors (Logging, Transform, Cache)
- ✅ Exception Filters (Tratamento de Erros)
- ✅ Middleware
- ✅ Custom Decorators
- ✅ Request/Response Lifecycle

### 6. **Configuração e Environment**
- ✅ ConfigModule
- ✅ Environment Variables
- ✅ Validação de Variáveis de Ambiente
- ✅ Configurações por Stage (dev, prod, test)

### 7. **Documentação API**
- ✅ Swagger/OpenAPI
- ✅ Decorators do Swagger
- ✅ DTOs Documentados
- ✅ Autenticação no Swagger

### 8. **Testing**
- ✅ Unit Tests (Services)
- ✅ Integration Tests (Controllers)
- ✅ E2E Tests (End-to-End)
- ✅ Mocks e Stubs
- ✅ Test Coverage

### 9. **Features Adicionais**
- ✅ File Upload/Download
- ✅ Scheduled Tasks (Cron Jobs)
- ✅ Events (EventEmitter)
- ✅ Queues (Bull/BullMQ)
- ✅ Caching (Cache Manager)
- ✅ Rate Limiting
- ✅ CORS
- ✅ Helmet (Security Headers)
- ✅ Compression
- ✅ Logging Avançado (Winston/Pino)

### 10. **Boas Práticas e Padrões**
- ✅ Clean Architecture
- ✅ SOLID Principles
- ✅ Error Handling Patterns
- ✅ API Versioning
- ✅ Pagination
- ✅ Filtering e Sorting
- ✅ Soft Delete
- ✅ Audit Trail

---

## 🏢 Domínio de Negócio

### Sistema de Gerenciamento de Biblioteca

**Entidades Principais:**

1. **Users (Usuários)**
   - Administradores
   - Bibliotecários
   - Membros/Leitores

2. **Books (Livros)**
   - Título, ISBN, descrição
   - Número de cópias disponíveis
   - Categoria, ano de publicação

3. **Authors (Autores)**
   - Nome, biografia
   - Relacionamento N:N com Books

4. **Categories (Categorias)**
   - Nome, descrição
   - Relacionamento 1:N com Books

5. **Loans (Empréstimos)**
   - Usuário, Livro
   - Data de empréstimo/devolução
   - Status (ativo, devolvido, atrasado)

6. **Reservations (Reservas)**
   - Usuário, Livro
   - Data da reserva
   - Status (pendente, confirmada, cancelada)

7. **Fines (Multas)**
   - Relacionada a empréstimos atrasados
   - Valor, status (paga/pendente)

**Regras de Negócio:**

- ✅ Usuário pode emprestar no máximo 3 livros simultaneamente
- ✅ Prazo de empréstimo: 14 dias
- ✅ Multa diária por atraso: R$ 2,00
- ✅ Não pode emprestar se tiver multas pendentes
- ✅ Reserva só pode ser feita se não houver cópias disponíveis
- ✅ Renovação de empréstimo (máximo 2 vezes)
- ✅ Notificações de vencimento próximo
- ✅ Relatórios de livros mais emprestados

---

## 🚀 Fases do Projeto

### **Fase 1: Setup e Fundamentos** 
**Tempo estimado: 1 dia**

**Conceitos:**
- Setup inicial do projeto NestJS
- Estrutura de pastas
- Primeiro módulo, controller e service
- Injeção de dependência básica

**Implementação:**
```
1. Instalar NestJS CLI
2. Criar projeto
3. Configurar ESLint e Prettier
4. Criar módulo "Books" básico
5. Implementar CRUD in-memory (sem banco ainda)
6. Testar endpoints com REST Client
```

**Resultado:** API REST básica funcionando com array em memória.

---

### **Fase 2: Banco de Dados e Prisma**
**Tempo estimado: 1-2 dias**

**Conceitos:**
- Integração Prisma
- Schema e Migrations
- Relacionamentos
- CRUD com banco de dados real

**Implementação:**
```
1. Instalar e configurar Prisma
2. Criar schema com entidades: User, Book, Author, Category
3. Definir relacionamentos
4. Gerar migrations
5. Implementar PrismaService
6. Refatorar CRUD para usar banco de dados
7. Seed inicial de dados
```

**Resultado:** API conectada ao PostgreSQL com dados persistidos.

---

### **Fase 3: Validação e DTOs**
**Tempo estimado: 1 dia**

**Conceitos:**
- DTOs (Data Transfer Objects)
- Class Validator
- Class Transformer
- Pipes (ValidationPipe)

**Implementação:**
```
1. Instalar class-validator e class-transformer
2. Criar DTOs para Create/Update
3. Adicionar validações (@IsString, @IsEmail, etc.)
4. Configurar ValidationPipe global
5. Criar Custom Pipe para transformações
6. Tratamento de erros de validação
```

**Resultado:** API com validação robusta de entrada de dados.

---

### **Fase 4: Autenticação e Autorização**
**Tempo estimado: 2 dias**

**Conceitos:**
- JWT
- Passport
- AuthGuard
- RolesGuard
- Decorators customizados

**Implementação:**
```
1. Instalar @nestjs/jwt, @nestjs/passport, passport-jwt
2. Criar módulo Auth
3. Implementar registro e login
4. Hash de senhas com bcrypt
5. Gerar e validar JWT
6. Criar JwtAuthGuard
7. Criar RolesGuard para RBAC
8. Decorator @CurrentUser e @Roles
9. Proteger rotas
10. Implementar Refresh Tokens
```

**Resultado:** Sistema completo de autenticação com controle de acesso por roles.

---

### **Fase 5: Exception Filters e Error Handling**
**Tempo estimado: 1 dia**

**Conceitos:**
- Exception Filters
- Custom Exceptions
- Error Response Patterns
- HTTP Exception Filters

**Implementação:**
```
1. Criar estrutura de exceptions customizadas
2. Implementar HttpExceptionFilter
3. Implementar PrismaExceptionFilter
4. Padronizar respostas de erro
5. Logger de erros
6. Try-catch global
```

**Resultado:** Tratamento profissional de erros em toda API.

---

### **Fase 6: Interceptors**
**Tempo estimado: 1 dia**

**Conceitos:**
- Interceptors
- TransformInterceptor
- LoggingInterceptor
- TimeoutInterceptor
- CacheInterceptor

**Implementação:**
```
1. Criar LoggingInterceptor (request/response log)
2. Criar TransformInterceptor (padronizar respostas)
3. Criar TimeoutInterceptor
4. Criar CacheInterceptor básico
5. Aplicar interceptors globalmente
```

**Resultado:** Controle total sobre ciclo de vida das requisições.

---

### **Fase 7: Middleware**
**Tempo estimado: 0.5 dia**

**Conceitos:**
- Middleware
- Function Middleware
- Class Middleware
- Middleware Chain

**Implementação:**
```
1. Criar LoggerMiddleware
2. Criar RequestIdMiddleware
3. Aplicar middleware em rotas específicas
4. Aplicar middleware globalmente
```

**Resultado:** Processamento adicional antes dos controllers.

---

### **Fase 8: Configuração e Environment**
**Tempo estimado: 0.5 dia**

**Conceitos:**
- ConfigModule
- Environment Variables
- Validação de Env
- Configurações por Stage

**Implementação:**
```
1. Instalar @nestjs/config
2. Criar arquivos .env (dev, prod, test)
3. Configurar ConfigModule
4. Criar esquema de validação (Joi)
5. Injetar configurações nos módulos
6. Separar configs por domínio
```

**Resultado:** Gestão profissional de configurações e ambientes.

---

### **Fase 9: Documentação com Swagger**
**Tempo estimado: 1 dia**

**Conceitos:**
- @nestjs/swagger
- Decorators do Swagger
- ApiProperty, ApiTags, ApiResponse
- Autenticação no Swagger

**Implementação:**
```
1. Instalar @nestjs/swagger
2. Configurar SwaggerModule
3. Adicionar decorators em DTOs
4. Adicionar decorators em Controllers
5. Documentar autenticação
6. Adicionar exemplos e descrições
7. Agrupar endpoints por tags
```

**Resultado:** Documentação interativa completa da API.

---

### **Fase 10: Regras de Negócio - Loans (Empréstimos)**
**Tempo estimado: 2 dias**

**Conceitos:**
- Lógica de negócio complexa
- Transações
- Status e State Management
- Business Rules

**Implementação:**
```
1. Criar módulo Loans
2. Implementar emprestar livro
3. Validar disponibilidade
4. Validar limite de empréstimos
5. Validar multas pendentes
6. Implementar devolução
7. Calcular multas
8. Implementar renovação
9. Status de empréstimo
```

**Resultado:** Funcionalidade core do sistema funcionando.

---

### **Fase 11: Events e Notifications**
**Tempo estimado: 1 dia**

**Conceitos:**
- EventEmitter2
- Events e Listeners
- Desacoplamento via eventos
- Domain Events

**Implementação:**
```
1. Instalar @nestjs/event-emitter
2. Criar eventos (BookBorrowedEvent, LoanOverdueEvent)
3. Criar listeners (enviar notificação, atualizar estatísticas)
4. Emitir eventos nas operações
5. Implementar sistema de notificações básico
```

**Resultado:** Sistema reativo e desacoplado.

---

### **Fase 12: Scheduled Tasks (Cron Jobs)**
**Tempo estimado: 0.5 dia**

**Conceitos:**
- @nestjs/schedule
- Cron Jobs
- Intervals
- Timeouts

**Implementação:**
```
1. Instalar @nestjs/schedule
2. Criar job para verificar empréstimos atrasados
3. Criar job para enviar lembretes de devolução
4. Criar job para limpar dados antigos
5. Configurar horários de execução
```

**Resultado:** Tarefas automáticas rodando em background.

---

### **Fase 13: Queues (Filas)**
**Tempo estimado: 1 dia**

**Conceitos:**
- BullMQ
- Producers e Consumers
- Job Processing
- Queue Management

**Implementação:**
```
1. Instalar @nestjs/bullmq, bullmq, ioredis
2. Configurar Redis
3. Criar fila para envio de emails
4. Criar fila para processamento de relatórios
5. Implementar producers
6. Implementar consumers/processors
7. Adicionar retry logic
```

**Resultado:** Processamento assíncrono robusto.

---

### **Fase 14: Caching**
**Tempo estimado: 0.5 dia**

**Conceitos:**
- Cache Manager
- Redis Cache
- Cache Strategies
- TTL

**Implementação:**
```
1. Instalar @nestjs/cache-manager
2. Configurar Redis para cache
3. Implementar cache em listagens
4. Implementar cache em detalhes
5. Invalidar cache em updates
6. Configurar TTL por tipo de dado
```

**Resultado:** Performance otimizada com cache.

---

### **Fase 15: File Upload**
**Tempo estimado: 1 dia**

**Conceitos:**
- Multer
- File Validation
- Storage (local/cloud)
- File Pipes

**Implementação:**
```
1. Instalar @nestjs/platform-express, multer
2. Configurar MulterModule
3. Criar endpoint para upload de capa de livro
4. Validar tipo e tamanho de arquivo
5. Processar e salvar arquivo
6. Criar endpoint para download
7. Implementar avatar de usuário
```

**Resultado:** Upload e download de arquivos.

---

### **Fase 16: Pagination, Filtering e Sorting**
**Tempo estimado: 1 dia**

**Conceitos:**
- Query Parameters
- Pagination DTO
- Dynamic Filters
- Order By

**Implementação:**
```
1. Criar PaginationDto
2. Criar FilterDto
3. Implementar paginação em listagens
4. Implementar filtros dinâmicos
5. Implementar ordenação
6. Criar helper para query building
7. Retornar metadata (total, pages, etc.)
```

**Resultado:** Listagens profissionais e performáticas.

---

### **Fase 17: Soft Delete e Audit**
**Tempo estimado: 1 dia**

**Conceitos:**
- Soft Delete
- Audit Trail
- Created/Updated metadata
- Histórico de alterações

**Implementação:**
```
1. Adicionar campos de audit (createdAt, updatedAt, deletedAt, createdBy)
2. Implementar soft delete
3. Criar filtros para excluir soft deleted
4. Criar endpoint para listar deletados
5. Implementar restore
6. Criar tabela de audit/history
7. Registrar alterações importantes
```

**Resultado:** Rastreabilidade completa de dados.

---

### **Fase 18: Security (Helmet, Rate Limiting, CORS)**
**Tempo estimado: 0.5 dia**

**Conceitos:**
- Helmet
- Rate Limiting
- CORS
- Security Best Practices

**Implementação:**
```
1. Instalar helmet
2. Configurar security headers
3. Instalar @nestjs/throttler
4. Configurar rate limiting
5. Configurar CORS
6. Adicionar compression
7. CSP headers
```

**Resultado:** API segura contra ataques comuns.

---

### **Fase 19: Logging Avançado**
**Tempo estimado: 1 dia**

**Conceitos:**
- Winston/Pino
- Log Levels
- Log Formatting
- Log Rotation
- Centralized Logging

**Implementação:**
```
1. Instalar Winston ou Pino
2. Criar LoggerService customizado
3. Configurar log levels por ambiente
4. Implementar log rotation
5. Formatar logs (JSON para prod)
6. Adicionar context aos logs
7. Log de requisições e respostas
```

**Resultado:** Sistema de logging profissional.

---

### **Fase 20: Testing Completo**
**Tempo estimado: 2-3 dias**

**Conceitos:**
- Jest
- Unit Tests
- Integration Tests
- E2E Tests
- Test Coverage
- Mocking

**Implementação:**
```
1. Configurar Jest
2. Escrever Unit Tests para Services
3. Escrever Integration Tests para Controllers
4. Escrever E2E Tests para fluxos completos
5. Mock de dependências (Prisma, etc.)
6. Test Database
7. Configurar coverage
8. CI/CD com testes
```

**Resultado:** Cobertura de testes > 80%.

---

### **Fase 21: Relatórios e Analytics**
**Tempo estimado: 1-2 dias**

**Conceitos:**
- Aggregate Queries
- Statistics
- Report Generation
- Data Export

**Implementação:**
```
1. Endpoint: Livros mais emprestados
2. Endpoint: Usuários mais ativos
3. Endpoint: Estatísticas gerais
4. Endpoint: Multas por período
5. Exportar relatórios (CSV, PDF)
6. Dashboard data
```

**Resultado:** Insights e relatórios do sistema.

---

### **Fase 22: API Versioning**
**Tempo estimado: 0.5 dia**

**Conceitos:**
- URI Versioning
- Header Versioning
- Versioning Strategies
- Backward Compatibility

**Implementação:**
```
1. Configurar versioning
2. Criar v1 e v2 de um endpoint
3. Manter compatibilidade
4. Documentar versões no Swagger
```

**Resultado:** API versionada profissionalmente.

---

### **Fase 23: Health Checks e Monitoring**
**Tempo estimado: 0.5 dia**

**Conceitos:**
- @nestjs/terminus
- Health Indicators
- Readiness/Liveness
- Metrics

**Implementação:**
```
1. Instalar @nestjs/terminus
2. Criar health check endpoint
3. Verificar database health
4. Verificar redis health
5. Verificar disk space
6. Verificar memory usage
```

**Resultado:** Monitoramento da saúde da aplicação.

---

### **Fase 24: Deploy e Production Ready**
**Tempo estimado: 1 dia**

**Conceitos:**
- Docker
- Docker Compose
- Environment Production
- Build Optimization
- PM2

**Implementação:**
```
1. Criar Dockerfile
2. Criar docker-compose.yml
3. Configurar variáveis de produção
4. Build otimizado
5. Configurar PM2 (opcional)
6. Deploy em cloud (Heroku/Railway/AWS)
```

**Resultado:** Aplicação pronta para produção.

---

## 📁 Estrutura Final do Projeto

```
poc-learn-nest/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── auth/
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── strategies/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── books/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── books.controller.ts
│   │   ├── books.service.ts
│   │   └── books.module.ts
│   ├── authors/
│   ├── categories/
│   ├── users/
│   ├── loans/
│   ├── reservations/
│   ├── fines/
│   ├── notifications/
│   ├── reports/
│   ├── common/
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── interfaces/
│   │   ├── middleware/
│   │   ├── pipes/
│   │   └── utils/
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── app.config.ts
│   ├── database/
│   │   └── prisma.service.ts
│   ├── health/
│   │   └── health.controller.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── app.module.ts
│   └── main.ts
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .env.development
├── .env.production
├── .eslintrc.js
├── .prettierrc
├── docker-compose.yml
├── Dockerfile
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🎯 Checklist de Conceitos Aprendidos

Ao final do projeto, você terá domínio de:

- [ ] Arquitetura modular do NestJS
- [ ] Injeção de dependência
- [ ] Controllers e rotas
- [ ] Services e lógica de negócio
- [ ] Integração com banco de dados (Prisma)
- [ ] Validação com DTOs
- [ ] Autenticação JWT
- [ ] Autorização com Guards e RBAC
- [ ] Middleware customizado
- [ ] Interceptors
- [ ] Exception Filters
- [ ] Pipes customizados
- [ ] Decorators customizados
- [ ] ConfigModule e variáveis de ambiente
- [ ] Swagger/OpenAPI
- [ ] Events e EventEmitter
- [ ] Scheduled Tasks (Cron)
- [ ] Queues (BullMQ)
- [ ] Caching (Redis)
- [ ] File Upload/Download
- [ ] Pagination, Filtering, Sorting
- [ ] Soft Delete e Audit
- [ ] Security (Helmet, Rate Limiting, CORS)
- [ ] Logging avançado
- [ ] Testing (Unit, Integration, E2E)
- [ ] Health Checks
- [ ] Docker e Deploy

---

## 📖 Recursos de Estudo Complementares

1. **Documentação Oficial:** https://docs.nestjs.com
2. **NestJS Courses:** (Udemy, Pluralsight)
3. **GitHub Examples:** https://github.com/nestjs/nest/tree/master/sample
4. **Discord NestJS:** Comunidade ativa

---

## 🚀 Próximos Passos

1. **Começar pela Fase 1** - Setup inicial
2. **Progredir fase por fase** - Não pular etapas
3. **Praticar cada conceito** - Fazer experimentos
4. **Revisar código** - Aplicar boas práticas
5. **Documentar aprendizados** - Anotar insights

---

## 💡 Dicas Importantes

- ⚠️ **Não tenha pressa** - Cada conceito leva tempo para absorver
- ⚠️ **Pratique muito** - Faça mais do que o roteiro sugere
- ⚠️ **Leia a documentação** - É excelente e bem escrita
- ⚠️ **Faça perguntas** - Não deixe dúvidas acumularem
- ⚠️ **Code review** - Revise seu próprio código constantemente
- ⚠️ **Teste tudo** - Teste cada feature que implementar

---

**Tempo Total Estimado:** 20-25 dias de estudo focado

**Resultado Final:** Domínio completo do NestJS para atuar profissionalmente em projetos desde o zero.

Boa sorte! 🚀
