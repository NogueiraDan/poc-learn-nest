<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<h1 align="center">📚 Library Management System</h1>

<p align="center">
  <strong>Sistema completo de gerenciamento de biblioteca desenvolvido com NestJS, Prisma e PostgreSQL</strong>
</p>

<p align="center">
  Sistema enterprise-ready com regras de negócio complexas, autenticação JWT, controle de acesso (RBAC),<br>
  gestão de empréstimos com multas automáticas, sistema de filas de reserva e 153 testes unitários.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Jest-323330?style=for-the-badge&logo=Jest&logoColor=white" alt="Jest" />
</p>

<p align="center">
  <a href="../../actions/workflows/ci.yml"><img src="https://github.com/YOUR_USERNAME/poc-learn-nest/actions/workflows/ci.yml/badge.svg" alt="CI/CD Pipeline" /></a>
  <a href="https://codecov.io/gh/YOUR_USERNAME/poc-learn-nest"><img src="https://codecov.io/gh/YOUR_USERNAME/poc-learn-nest/branch/main/graph/badge.svg" alt="codecov" /></a>
  <img src="https://img.shields.io/badge/coverage-73%25-brightgreen" alt="Coverage" />
  <img src="https://img.shields.io/badge/tests-153%20passing-brightgreen" alt="Tests" />
</p>

---

## 🎯 TL;DR - Quick Facts

> **O que é?** Sistema completo de biblioteca com empréstimos, reservas, multas automáticas e controle de acesso.

| Aspecto | Detalhe |
|---------|---------|
| **Domínio** | Biblioteca (Books, Loans, Reservations, Fines) |
| **Regras de Negócio** | 11 regras complexas (limite empréstimos, multas, filas FIFO) |
| **Autenticação** | JWT (Access + Refresh) + RBAC (3 roles) |
| **Database** | PostgreSQL + Prisma ORM (7 entidades) |
| **Mensageria** | RabbitMQ (Event-Driven + Cronjobs) |
| **Testes** | 153 unit tests, 73% coverage |
| **Documentação** | Swagger + 1000+ linhas de docs |
| **Features** | Swagger, Security, Versioning, Health Checks, Async Jobs |
| **Status** | ✅ Production-Ready |

**📖 [Ver Regras de Negócio Detalhadas →](docs/BUSINESS-DOMAIN.md)**  
**⚡ [Setup em 5 minutos →](docs/QUICK-START.md)**

---

## 📑 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Tecnologias](#-tecnologias)
- [Status CI/CD](#-status-do-cicd)
- [Funcionalidades](#-funcionalidades-principais)
- [Enterprise Features](#-enterprise-features)
- [Documentação](#-documentação-completa)
- [Postman Collection](#-postman-collection)
- [Por Que Este Projeto?](#-por-que-este-projeto)
- [Papéis e Permissões](#-papéis-e-permissões)
- [Fluxo de Uso](#-fluxo-de-uso-típico)
- [Arquitetura](#️-arquitetura-e-stack-técnico)
- [Exemplos de Uso](#-exemplos-de-uso-da-api)
- [Setup do Projeto](#project-setup)
- [Testes](#run-tests)
- [Deployment](#deployment)

---

## 📋 Sobre o Projeto

**Sistema de Gerenciamento de Biblioteca** é uma aplicação **enterprise-ready** desenvolvida como POC (Proof of Concept) para demonstrar boas práticas de desenvolvimento com NestJS.

### 🎯 O Que Este Sistema Faz?

Simula o funcionamento completo de uma biblioteca moderna, permitindo:

- **Gerenciar acervo** de livros com informações detalhadas (título, ISBN, autores, categoria)
- **Controlar empréstimos** com validações automáticas de disponibilidade
- **Aplicar regras de negócio** como limites de empréstimos simultâneos e prazos de devolução
- **Calcular multas automaticamente** por atraso (R$ 2,00/dia)
- **Gerenciar filas de reservas** quando livros estão indisponíveis (sistema FIFO)
- **Controlar acesso** com autenticação JWT e três níveis de permissão (Admin, Bibliotecário, Membro)

### 🏢 Domínio de Negócio

O sistema implementa regras realistas de uma biblioteca:

- **Limite de 3 empréstimos simultâneos** por usuário
- **Prazo de 14 dias** para devolução (prorrogável até 2 vezes)
- **Bloqueio automático** de usuários com empréstimos atrasados ou multas pendentes
- **Fila de reservas** ordenada por ordem de chegada (First In, First Out)
- **Atualização automática** de disponibilidade ao emprestar/devolver
- **Multas progressivas** aplicadas automaticamente na devolução

### 📊 Métricas do Projeto

- 🧪 **153 testes unitários** com **73% de cobertura**
- 📦 **8 módulos** funcionais (Auth, Books, Authors, Categories, Loans, Reservations, Users, Health)
- 🔐 **6 features enterprise** implementadas (Swagger, Security, Versioning, Health Checks, etc.)
- 📝 **900+ linhas** de documentação técnica e de negócio
- ⚡ **CI/CD** configurado com GitHub Actions

## 🚀 Tecnologias

Este projeto utiliza tecnologias modernas e consolidadas do ecossistema Node.js:

### Core
- **[NestJS](https://nestjs.com/)** 11 - Framework progressivo, opinativo e escalável para Node.js
- **[TypeScript](https://www.typescriptlang.org/)** - Superset JavaScript com tipagem estática
- **[Node.js](https://nodejs.org/)** 20+ - Runtime JavaScript assíncrono

### Database & ORM
- **[PostgreSQL](https://www.postgresql.org/)** - Banco relacional robusto e feature-rich
- **[Prisma](https://www.prisma.io/)** - ORM moderno com type-safety, migrations e Prisma Studio

### Autenticação & Segurança
- **[JWT](https://jwt.io/)** - JSON Web Tokens para autenticação stateless
- **[Passport.js](http://www.passportjs.org/)** - Middleware de autenticação flexível
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** - Hashing seguro de senhas
- **[Helmet](https://helmetjs.github.io/)** - Security headers HTTP
- **[@nestjs/throttler](https://docs.nestjs.com/security/rate-limiting)** - Rate limiting

### Validação & Transformação
- **[class-validator](https://github.com/typestack/class-validator)** - Validação declarativa via decorators
- **[class-transformer](https://github.com/typestack/class-transformer)** - Transformação de objetos

### Testing & Quality
- **[Jest](https://jestjs.io/)** - Framework de testes com excelente DX
- **[Supertest](https://github.com/visionmedia/supertest)** - Testes de integração HTTP
- **[ESLint](https://eslint.org/)** - Linting de código
- **[Prettier](https://prettier.io/)** - Formatação automática

### Documentação
- **[@nestjs/swagger](https://docs.nestjs.com/openapi/introduction)** - OpenAPI/Swagger automático
- **[Swagger UI](https://swagger.io/tools/swagger-ui/)** - Interface interativa de documentação

### DevOps
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD automation
- **[Docker](https://www.docker.com/)** - Containerização (docker-compose para dev)
- **[@nestjs/terminus](https://docs.nestjs.com/recipes/terminus)** - Health checks para Kubernetes

## 📊 Status do CI/CD

O projeto possui pipeline automatizado que executa:

- ✅ **Testes Unitários** em Node.js 20.19+ e 22+
- ✅ **Cobertura de Código** com relatórios automáticos
- ✅ **Linting** e verificação de código
- ✅ **Build** da aplicação
- ✅ **Análise de Qualidade** (TypeScript + Prettier)

[Ver pipeline completo](.github/workflows/ci.yml)

## 🎯 Funcionalidades Principais

### 👥 Gestão de Usuários e Autenticação
- **Três papéis distintos**: Admin, Bibliotecário (Librarian) e Membro (Member)
- **Autenticação JWT** com access token e refresh token
- **RBAC (Role-Based Access Control)**: Cada papel tem permissões específicas
- **Guards customizados**: `@Public()`, `@Roles()`, `@CurrentUser()`
- **Segurança**: Senhas criptografadas com bcrypt, rate limiting (10 req/min)

### 📚 Gerenciamento do Acervo
- **CRUD completo** de livros, autores e categorias
- **Relacionamentos complexos**: Livros ↔ Autores (N:N), Livros ↔ Categoria (N:1)
- **Busca avançada**: Por título, ISBN, categoria, autor, ano de publicação
- **Controle de estoque**: Total de cópias e disponíveis em tempo real
- **Validações**: ISBN único, integridade referencial

### 🔄 Sistema de Empréstimos
- **Validações pré-empréstimo**:
  - Livro disponível (availableCopies > 0)
  - Usuário sem empréstimos atrasados
  - Usuário sem multas pendentes
  - Limite de 3 empréstimos simultâneos não atingido
- **Devolução inteligente**:
  - Cálculo automático de dias de atraso
  - Geração automática de multas (R$ 2,00/dia)
  - Confirmação automática da próxima reserva na fila
- **Renovações**: Até 2 renovações de 14 dias cada
- **Transações atômicas**: Empréstimo + atualização de estoque em transação única

### 📌 Sistema de Reservas
- **Fila FIFO**: Primeiro a reservar é o primeiro a ser atendido
- **Validações inteligentes**:
  - Só permite reserva se livro está indisponível
  - Impede reservas duplicadas do mesmo usuário/livro
  - Impede reservar livro já emprestado pelo usuário
- **Confirmação automática**: Quando livro é devolvido, primeira reserva é confirmada
- **Posição na fila**: Usuário vê sua posição ao fazer reserva
- **Cancelamento**: Usuário pode cancelar reserva a qualquer momento

### 💰 Sistema de Multas
- **Cálculo automático**: Gerada automaticamente na devolução se atrasado
- **Valor fixo**: R$ 2,00 por dia de atraso
- **Estados**: PENDING (bloqueante), PAID, CANCELLED
- **Tipos**: Atraso (automático), Dano (manual), Perda (manual)
- **Bloqueio**: Multas pendentes impedem novos empréstimos

### 🐰 Mensageria e Processamento Assíncrono
- **RabbitMQ** como message broker para arquitetura orientada a eventos
- **Event-Driven**: Módulos desacoplados se comunicam via eventos
- **Notificações assíncronas**: 
  - Confirmação de empréstimo (email)
  - Lembrete de vencimento
  - Notificação de atraso
  - Reserva disponível
  - Multa gerada
- **Scheduled Jobs**: Cronjob diário verifica empréstimos atrasados
- **Performance**: Respostas HTTP instantâneas (processamento em background)
- **Escalabilidade**: Múltiplos consumers podem processar em paralelo
- **Resiliência**: RabbitMQ garante entrega de mensagens

📖 **[Ver documentação completa de mensageria →](docs/MESSAGING.md)**

## ✨ Enterprise Features

Este projeto implementa features de **nível enterprise** para produção:

### 📚 Swagger/OpenAPI Documentation
- Documentação automática completa da API
- Acesse em: `http://localhost:3000/api/docs`
- Todos os endpoints, DTOs e responses documentados
- Autenticação JWT integrada no Swagger UI

### 🔒 Security
- **Helmet**: Headers HTTP seguros (CSP, X-Frame-Options, etc.)
- **CORS**: Configuração de Cross-Origin Resource Sharing
- **Rate Limiting**: Proteção contra ataques (10 req/60s por IP)

### 🔄 Interceptors
- **LoggingInterceptor**: Log automático de todas requisições/respostas
- **TimeoutInterceptor**: Timeout de 30s para prevenir travamento
- **TransformInterceptor**: Padronização opcional do formato de respostas

### 🛣️ Middleware
- **LoggerMiddleware**: Logging detalhado com Request ID único (UUID)
- Sanitização de dados sensíveis (passwords, tokens)
- Rastreamento completo de requisições

### 📌 API Versioning
- Versionamento via URI: `/v1/books`, `/v2/books`
- Manutenção de compatibilidade com versões antigas
- Versão padrão: v1

### 🏥 Health Checks
- **`GET /v1/health`**: Check completo (Database, Memory, Disk)
- **`GET /v1/health/liveness`**: Kubernetes liveness probe
- **`GET /v1/health/readiness`**: Kubernetes readiness probe
- Integração com Prometheus, Datadog, etc.

## 📚 Documentação Completa

Este projeto possui documentação extensa (1000+ linhas) cobrindo todos os aspectos:

- **[📖 Domínio de Negócio](docs/BUSINESS-DOMAIN.md)** - **Leia primeiro!**
  - Regras de negócio detalhadas (11 regras principais)
  - Casos de uso completos (8 cenários)
  - Fluxos de processo (empréstimo, devolução, reserva)
  - Glossário de termos do domínio
  - Validações e restrições
  
- **[⚡ Enterprise Features](docs/ENTERPRISE-FEATURES.md)** - Detalhes técnicos
  - Swagger/OpenAPI documentation
  - Security (Helmet, CORS, Rate Limiting)
  - Interceptors e Middleware
  - API Versioning
  - Health Checks

- **[🐰 Mensageria com RabbitMQ](docs/MESSAGING.md)** - **NOVO!**
  - Event-Driven Architecture
  - Processamento assíncrono
  - Scheduled Jobs (Cronjobs)
  - Notificações em background
  - RabbitMQ vs Kafka
  - [⚡ Quick Start Mensageria](docs/MESSAGING-QUICKSTART.md)
  
- **[📊 Status do Projeto](docs/COMPLETED-FEATURES.md)** - Progresso e métricas
  - 11 fases completadas
  - Cobertura de testes por módulo
  - Próximos passos recomendados
  
- **[🚀 Quick Start](docs/QUICK-START.md)** - Setup rápido
  - Guia passo a passo
  - Exemplos de requisições
  - Troubleshooting

## 📮 Postman Collection

**Collection completa e pronta para uso com 40+ endpoints!** 🚀

Agora você não precisa criar as requisições manualmente no Postman. Tudo já está configurado:

### 📦 O Que Está Incluído?

- ✅ **40+ endpoints** organizados por módulo (Auth, Books, Authors, Categories, Loans, Reservations, Health)
- ✅ **Bodies de exemplo** em todas as requisições POST/PATCH
- ✅ **Autenticação JWT automática** - Os tokens são salvos automaticamente ao fazer login
- ✅ **Filtros e query params** pré-configurados
- ✅ **Variáveis da collection** prontas e isoladas (não afetam outras collections!)
- ✅ **Scripts de teste** para capturar tokens automaticamente
- ✅ **Documentação** em cada endpoint

### 🚀 Como Usar (2 passos)

1. **Importar a Collection:**
   - Abra o Postman
   - Clique em **Import**
   - Selecione o arquivo [`postman-collection.json`](postman-collection.json)
   - ✅ Pronto! Todas as variáveis já vêm configuradas dentro da collection

2. **Começar a testar:**
   - Execute `Auth → Login` para autenticar
   - Os tokens serão salvos automaticamente
   - Use qualquer outro endpoint normalmente! 🎉

### 📚 Estrutura da Collection

```
📁 Library Management System - NestJS
├── 📁 Auth (4 endpoints)
│   ├── Register, Login, Refresh Token, Get Profile
├── 📁 Books (5 endpoints)
│   ├── Create, List (com filtros), Get, Update, Delete
├── 📁 Authors (5 endpoints)
├── 📁 Categories (5 endpoints)
├── 📁 Loans (6 endpoints)
│   ├── Create, List, Get, Stats, Return, Renew
├── 📁 Reservations (6 endpoints)
│   ├── Create, List, Get, Queue, Cancel, Fulfill
└── 📁 Health (3 endpoints)
    ├── Complete, Liveness, Readiness
```

### 📖 Documentação Detalhada

Para guia completo de uso, filtros, troubleshooting e dicas:

**→ [POSTMAN-GUIDE.md](POSTMAN-GUIDE.md)** - Guia completo do Postman Collection

### 🎯 Exemplo Rápido

```bash
# 1. Importar collection no Postman (arquivo: postman-collection.json)
# 2. Executar:
Auth → Login (Public)

# ✅ Tokens salvos automaticamente nas variáveis da collection!
# Agora todos os outros endpoints já funcionam com autenticação
```

**Arquivos:**
- [`postman-collection.json`](postman-collection.json) - Collection completa com variáveis isoladas
- [`POSTMAN-GUIDE.md`](POSTMAN-GUIDE.md) - Guia de uso completo
  - [⚡ Quick Start Mensageria](docs/MESSAGING-QUICKSTART.md)
  
- **[📊 Status do Projeto](docs/COMPLETED-FEATURES.md)** - Progresso e métricas
  - 11 fases completadas
  - Cobertura de testes por módulo
  - Próximos passos recomendados
  
- **[🚀 Quick Start](docs/QUICK-START.md)** - Setup rápido
  - Guia passo a passo
  - Exemplos de requisições
  - Troubleshooting

## 💡 Por Que Este Projeto?

Este repositório foi criado como **material de estudo e referência** para desenvolvimento NestJS, demonstrando:

✅ **Arquitetura limpa** com separação de responsabilidades  
✅ **Regras de negócio complexas** com validações em múltiplas camadas  
✅ **Testes abrangentes** com alta cobertura (73%)  
✅ **Features enterprise** prontas para produção  
✅ **Event-Driven Architecture** com RabbitMQ  
✅ **Processamento assíncrono** com scheduled jobs  
✅ **Documentação detalhada** de código e negócio  
✅ **Boas práticas** de TypeScript, NestJS e Prisma  
✅ **CI/CD configurado** com GitHub Actions  

Ideal para estudar, referenciar ou usar como base para projetos reais.

## 👤 Papéis e Permissões

O sistema implementa controle de acesso baseado em papéis (RBAC):

| Papel | Descrição | Exemplos de Permissões |
|-------|-----------|------------------------|
| **MEMBER** (Membro) | Leitor comum da biblioteca | • Buscar livros<br>• Fazer empréstimos (até 3)<br>• Fazer reservas<br>• Ver próprio histórico<br>• Pagar multas |
| **LIBRARIAN** (Bibliotecário) | Funcionário da biblioteca | • Tudo do MEMBER +<br>• Gerenciar livros (CRUD)<br>• Gerenciar autores e categorias<br>• Forçar devolução<br>• Criar multas manuais<br>• Ver todos os empréstimos |
| **ADMIN** (Administrador) | Administrador do sistema | • Tudo do LIBRARIAN +<br>• Gerenciar usuários<br>• Alterar papéis<br>• Cancelar multas<br>• Acesso total ao sistema |

## 🔄 Fluxo de Uso Típico

### Para um Membro (MEMBER):

```
1. Registra-se no sistema → Papel MEMBER automático
2. Faz login → Recebe Access Token + Refresh Token
3. Busca livros no catálogo
4. Empresta até 3 livros (prazo: 14 dias cada)
5. Renova empréstimo se necessário (até 2 vezes)
6. Devolve livro
   • No prazo → Sem custos
   • Atrasado → Multa automática (R$ 2,00/dia)
7. Se livro indisponível → Entra na fila de reservas
8. Quando livro disponível → Reserva confirmada automaticamente
```

### Para um Bibliotecário (LIBRARIAN):

```
1. Gerencia acervo: adiciona novos livros, autores, categorias
2. Monitora empréstimos ativos e atrasados
3. Força devolução se necessário
4. Cria multas manuais (dano, perda de livro)
5. Visualiza estatísticas e relatórios
```

## 🏗️ Arquitetura e Stack Técnico

### Stack Principal

**Backend Framework:**
- **NestJS 11** - Framework progressivo Node.js com TypeScript
- **TypeScript** - Linguagem tipada estaticamente
- **Node.js 18+** - Runtime JavaScript

**Database:**
- **PostgreSQL** - Banco de dados relacional
- **Prisma ORM** - Modern ORM com type-safety completo
- **7 entidades** principais (Users, Books, Authors, Categories, Loans, Reservations, Fines)

**Autenticação:**
- **JWT** - JSON Web Tokens (access + refresh)
- **bcrypt** - Hash seguro de senhas
- **Passport.js** - Middleware de autenticação

**Validação e Qualidade:**
- **class-validator** - Validação de DTOs
- **class-transformer** - Transformação de dados
- **Jest** - Framework de testes (153 testes, 73% coverage)
- **ESLint + Prettier** - Linting e formatação

### Diagrama de Módulos

```
┌─────────────────────────────────────────────────────────┐
│                      AppModule                          │
│                (Módulo Principal)                       │
└───────────┬─────────────────────────────────────────────┘
            │
    ┌───────┴────────┐
    │                │
    ▼                ▼
┌─────────┐    ┌──────────────┐
│  Auth   │    │   Prisma     │
│ Module  │◄───┤   Module     │
└────┬────┘    └──────▲───────┘
     │                │
     │    ┌───────────┴───────┬─────────┬──────────┬──────────┐
     │    │                   │         │          │          │
     ▼    ▼                   ▼         ▼          ▼          ▼
┌─────────────┐         ┌─────────┐ ┌──────┐ ┌────────┐ ┌─────────┐
│   Books     │         │ Authors │ │ Cats │ │ Loans  │ │ Reserv  │
│   Module    │◄────────┤ Module  │ │Module│ │ Module │ │ Module  │
└─────────────┘         └─────────┘ └──────┘ └────┬───┘ └────┬────┘
                                                   │          │
                                                   └────┬─────┘
                                                        ▼
                                                   ┌─────────┐
                                                   │  Fines  │
                                                   │(Lógica) │
                                                   └─────────┘
```

### Camadas da Aplicação

```
┌─────────────────────────────────────────────────┐
│  Controllers (Rotas/Endpoints)                  │ ← HTTP Requests
├─────────────────────────────────────────────────┤
│  Guards (Auth + Roles)                          │ ← Autorização
├─────────────────────────────────────────────────┤
│  Middleware (Logger, Sanitização)               │ ← Pré-processamento
├─────────────────────────────────────────────────┤
│  Interceptors (Logging, Timeout, Transform)     │ ← Processamento
├─────────────────────────────────────────────────┤
│  Services (Lógica de Negócio)                   │ ← Business Logic
├─────────────────────────────────────────────────┤
│  Prisma Client (ORM)                            │ ← Data Access
├─────────────────────────────────────────────────┤
│  PostgreSQL (Database)                          │ ← Persistência
└─────────────────────────────────────────────────┘
```

### Features Enterprise

- **Swagger/OpenAPI**: Documentação automática em `/api/docs`
- **Health Checks**: Endpoints para Kubernetes/monitoring (`/v1/health`)
- **API Versioning**: Versionamento via URI (`/v1/*`, `/v2/*`)
- **Security**: Helmet (headers seguros), CORS, Rate Limiting (10/min)
- **Logging**: Interceptor global com UUID por requisição
- **Error Handling**: Filters customizados (HTTP + Prisma exceptions)

## 📝 Exemplos de Uso da API

### 1. Registrar e Autenticar

```bash
# Registrar novo usuário (automaticamente MEMBER)
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123"
  }'

# Login
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senha123"
  }'

# Resposta:
{
  "user": { "id": 1, "name": "João Silva", "email": "joao@example.com", "role": "MEMBER" },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 2. Buscar Livros

```bash
# Listar todos os livros disponíveis
curl http://localhost:3000/v1/books?available=true&page=1&limit=10

# Buscar por título
curl http://localhost:3000/v1/books?search=Clean%20Code

# Filtrar por categoria e autor
curl http://localhost:3000/v1/books?categoryId=1&authorId=2
```

### 3. Fazer Empréstimo (requer autenticação)

```bash
# Emprestar livro
curl -X POST http://localhost:3000/v1/loans \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": 1,
    "userId": 1
  }'

# Resposta de sucesso:
{
  "message": "Empréstimo realizado com sucesso",
  "loan": {
    "id": 1,
    "userId": 1,
    "bookId": 1,
    "loanDate": "2026-02-20T10:00:00Z",
    "dueDate": "2026-03-06T10:00:00Z",
    "status": "ACTIVE"
  }
}

# Resposta de erro (se limite atingido):
{
  "statusCode": 400,
  "message": "Usuário João Silva já possui 3 empréstimo(s) ativo(s). Limite máximo: 3."
}
```

### 4. Fazer Reserva (quando livro indisponível)

```bash
curl -X POST http://localhost:3000/v1/reservations \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": 1,
    "userId": 1
  }'

# Resposta:
{
  "message": "Reserva criada com sucesso. Posição na fila: 3",
  "reservation": {
    "id": 1,
    "userId": 1,
    "bookId": 1,
    "status": "PENDING",
    "queuePosition": 3
  }
}
```

### 5. Devolver Livro

```bash
curl -X PATCH http://localhost:3000/v1/loans/1/return \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json"

# Se devolução atrasada (ex: 5 dias):
{
  "message": "Livro devolvido com sucesso. Multa aplicada: R$ 10,00 (5 dias de atraso)",
  "loan": { ... },
  "fine": {
    "id": 1,
    "amount": 10.00,
    "reason": "Atraso de 5 dias",
    "status": "PENDING"
  }
}
```

### 6. Acessar Swagger Documentation

```
🌐 Abra o navegador: http://localhost:3000/api/docs

• Veja todos os endpoints documentados
• Teste diretamente pela interface
• Autentique usando o botão "Authorize" com Bearer token
```

> 💡 **Dica**: Para exemplos completos e troubleshooting, consulte [docs/QUICK-START.md](docs/QUICK-START.md)

## Project setup

```bash
# Instalar dependências
$ npm install

# Configurar variáveis de ambiente
$ cp .env.example .env

# Subir banco de dados PostgreSQL (Docker)
$ docker-compose up -d

# Rodar migrations do Prisma
$ npx prisma migrate dev

# Gerar cliente Prisma
$ npx prisma generate

# (Opcional) Seed do banco de dados
$ npx prisma db seed
```

## ⚙️ Configuração do Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/library_db?schema=public"

# JWT
JWT_SECRET="seu-secret-super-secreto-aqui"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_SECRET="seu-refresh-secret-aqui"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# unit tests em modo watch
$ npm run test:watch

# test coverage
$ npm run test:cov

# e2e tests
$ npm run test:e2e
```

## 📈 Cobertura de Testes

O projeto possui **153 testes unitários** com **73% de cobertura**:

| Módulo | Statements | Branches | Functions | Lines |
|--------|-----------|----------|-----------|-------|
| Auth | 84.28% | 76.66% | 100% | 85.93% |
| Authors | 89.83% | 78.12% | 100% | 92.45% |
| Books | 90.00% | 75.00% | 100% | 92.18% |
| Categories | 90.16% | 79.41% | 100% | 92.72% |
| Loans | 88.65% | 84.37% | 95.00% | 89.62% |
| Reservations | 88.34% | 83.92% | 94.11% | 89.69% |

**Total:** 73.01% de cobertura geral

## 🔄 CI/CD Pipeline

O projeto utiliza **GitHub Actions** para integração e entrega contínua:

### Workflows Disponíveis

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Executa em push/PR para branches main/master/develop
   - Testa em Node.js 20.19+ e 22+
   - Roda linter, testes e build
   - Gera relatório de cobertura
   - Upload automático para Codecov

2. **Coverage Report** (`.github/workflows/coverage.yml`)
   - Executa apenas em push para main/master
   - Gera relatório detalhado de cobertura
   - Cria badges de cobertura
   - Arquiva relatórios por 90 dias

### Como Funciona

Cada push ou pull request dispara automaticamente:

```bash
✓ Checkout do código
✓ Setup do Node.js com cache
✓ Instalação de dependências (npm ci)
✓ Geração do Prisma Client
✓ Execução de linter
✓ Execução de todos os testes
✓ Geração de cobertura
✓ Build da aplicação
✓ Upload de artefatos
```

### Configurar Codecov (Opcional)

1. Criar conta em [codecov.io](https://codecov.io)
2. Conectar seu repositório GitHub
3. Adicionar o token como secret no GitHub:
   - Ir em Settings > Secrets > Actions
   - Criar `CODECOV_TOKEN` com o valor do token

## 📂 Estrutura do Projeto

```
src/
├── auth/              # Autenticação e autorização
│   ├── decorators/    # @Public(), @CurrentUser(), @Roles()
│   ├── guards/        # JwtAuthGuard, RolesGuard
│   ├── strategies/    # JWT Strategy
│   └── dto/           # DTOs de auth (login, register)
├── books/             # Gerenciamento de livros
│   ├── books.controller.ts
│   ├── books.service.ts
│   └── dto/           # CreateBookDto, UpdateBookDto, QueryBooksDto
├── authors/           # Gerenciamento de autores
├── categories/        # Gerenciamento de categorias
├── loans/             # Sistema de empréstimos
│   ├── loans.controller.ts
│   ├── loans.service.ts     # Lógica de negócio complexa
│   └── dto/                 # CreateLoanDto, ReturnLoanDto, RenewLoanDto
├── reservations/      # Sistema de reservas (fila FIFO)
│   ├── reservations.controller.ts
│   ├── reservations.service.ts
│   └── dto/
├── users/             # Gerenciamento de usuários
├── health/            # Health checks (Kubernetes-ready)
│   ├── health.controller.ts
│   ├── prisma.health.ts    # Custom health indicator
│   └── health.module.ts
├── prisma/            # Configuração do Prisma ORM
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── common/            # Recursos compartilhados
│   ├── dto/           # PaginationDto, PaginatedResponseDto
│   ├── filters/       # Exception filters (HTTP, Prisma)
│   ├── interceptors/  # Logging, Timeout, Transform
│   └── middleware/    # Logger middleware (UUID tracking)
└── main.ts            # Bootstrap da aplicação (Swagger, Security, etc)

prisma/
├── schema.prisma      # Schema do banco (7 models)
├── migrations/        # Migrations versionadas
└── seed.ts            # Dados iniciais (opcional)

docs/
├── BUSINESS-DOMAIN.md      # Regras de negócio (900+ linhas)
├── ENTERPRISE-FEATURES.md  # Features técnicas
├── COMPLETED-FEATURES.md   # Status e roadmap
└── QUICK-START.md          # Guia rápido de uso

test/
├── unit/              # Testes unitários (153 testes)
└── e2e/               # Testes end-to-end
```

## 🎓 Conceitos Demonstrados

Este projeto é excelente para aprender e demonstrar:

✅ **Arquitetura Modular** - Separação clara de responsabilidades (Controllers, Services, Repositories)  
✅ **Domain-Driven Design** - Modelagem rica do domínio de biblioteca  
✅ **SOLID Principles** - Código limpo e manutenível  
✅ **Dependency Injection** - Desacoplamento e testabilidade  
✅ **Authentication & Authorization** - JWT + RBAC implementação completa  
✅ **Database Modeling** - Relacionamentos complexos (1:N, N:N)  
✅ **Business Rules** - Validações em múltiplas camadas  
✅ **Transaction Management** - Operações atômicas com Prisma  
✅ **Error Handling** - Exception filters customizados  
✅ **Testing** - Unit tests com mocks, coverage 73%  
✅ **API Documentation** - Swagger/OpenAPI automático  
✅ **Security Best Practices** - Helmet, CORS, Rate Limiting, Input validation  
✅ **Observability** - Health checks, logging estruturado  
✅ **CI/CD** - GitHub Actions com múltiplos ambientes  

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
