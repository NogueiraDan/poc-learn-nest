# 🚀 Quick Start - Library Management API

Guia rápido para rodar o projeto em 5 minutos.

---

## 📋 Pré-requisitos

- Node.js 18+ 
- PostgreSQL 14+
- npm ou yarn

---

## ⚡ Setup Rápido

### 1. Clone e Instale
```bash
# Clone o repositório
git clone <url>
cd poc-learn-nest

# Instale dependências
npm install
```

### 2. Configure o Banco de Dados
```bash
# Suba PostgreSQL usando Docker (recomendado)
docker run --name library-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=library_db \
  -p 5432:5432 \
  -d postgres:14

# OU use um PostgreSQL local já instalado
```

### 3. Configure Variáveis de Ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env com suas configurações
```

**Conteúdo do .env:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/library_db?schema=public"
JWT_SECRET="seu-secret-super-secreto-aqui-change-me"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_SECRET="seu-refresh-secret-aqui-change-me"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
```

### 4. Rode as Migrations
```bash
# Aplicar migrations
npx prisma migrate dev

# Gerar Prisma Client
npx prisma generate

# (Opcional) Popular banco com dados de exemplo
npx prisma db seed
```

### 5. Inicie a Aplicação
```bash
# Modo desenvolvimento (com hot reload)
npm run start:dev

# Ou modo produção
npm run build
npm run start:prod
```

---

## ✅ Verificação

A aplicação está rodando se você ver:
```
🚀 Aplicação rodando em http://localhost:3000
📚 Documentação Swagger: http://localhost:3000/api/docs
```

---

## 🎯 Primeiros Passos

### 1. Acesse a Documentação Swagger
```
http://localhost:3000/api/docs
```

### 2. Registre um Usuário
```bash
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "admin123",
    "role": "ADMIN"
  }'
```

**Resposta:**
```json
{
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "ADMIN"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Faça Login
```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

### 4. Use o Token para Acessar Rotas Protegidas
```bash
# Substitua <TOKEN> pelo accessToken recebido
curl -X GET http://localhost:3000/v1/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

### 5. Crie uma Categoria
```bash
curl -X POST http://localhost:3000/v1/categories \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tecnologia",
    "description": "Livros sobre tecnologia e programação"
  }'
```

### 6. Crie um Livro
```bash
curl -X POST http://localhost:3000/v1/books \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Clean Code",
    "isbn": "978-0132350884",
    "description": "Um guia prático para escrever código limpo",
    "totalCopies": 5,
    "publicationYear": 2008,
    "categoryId": 1
  }'
```

### 7. Liste Livros (Rota Pública)
```bash
curl http://localhost:3000/v1/books

# Com filtros
curl "http://localhost:3000/v1/books?search=clean&page=1&limit=10"
```

### 8. Verifique Health Check
```bash
# Health completo
curl http://localhost:3000/v1/health

# Liveness probe
curl http://localhost:3000/v1/health/liveness

# Readiness probe
curl http://localhost:3000/v1/health/readiness
```

---

## 🧪 Rodando Testes

```bash
# Testes unitários
npm test

# Testes com coverage
npm run test:cov

# Testes em watch mode
npm run test:watch

# E2E tests
npm run test:e2e
```

---

## 📚 Endpoints Principais

### **Autenticação** (Públicas)
- `POST /v1/auth/register` - Registrar usuário
- `POST /v1/auth/login` - Login
- `POST /v1/auth/refresh` - Renovar token

### **Livros**
- `GET /v1/books` - Listar livros (pública)
- `GET /v1/books/:id` - Buscar livro (pública)
- `POST /v1/books` - Criar livro (ADMIN/LIBRARIAN)
- `PATCH /v1/books/:id` - Atualizar livro (ADMIN/LIBRARIAN)
- `DELETE /v1/books/:id` - Deletar livro (ADMIN/LIBRARIAN)

### **Empréstimos**
- `POST /v1/loans` - Criar empréstimo (LIBRARIAN)
- `GET /v1/loans` - Listar empréstimos (autenticado)
- `PATCH /v1/loans/:id/return` - Devolver livro (LIBRARIAN)
- `PATCH /v1/loans/:id/renew` - Renovar empréstimo (autenticado)

### **Reservas**
- `POST /v1/reservations` - Criar reserva (MEMBER)
- `GET /v1/reservations` - Listar reservas (autenticado)
- `PATCH /v1/reservations/:id/cancel` - Cancelar reserva (autenticado)

### **Health Checks** (Públicas)
- `GET /v1/health` - Health check completo
- `GET /v1/health/liveness` - Liveness probe
- `GET /v1/health/readiness` - Readiness probe

---

## 🎨 Usando Swagger UI

1. Acesse: `http://localhost:3000/api/docs`

2. Clique em **"Authorize"** no topo direito

3. Cole seu `accessToken` (sem "Bearer")

4. Agora você pode testar todos os endpoints diretamente na interface!

---

## 🐳 Docker (Opcional)

```bash
# Subir apenas PostgreSQL
docker-compose up -d postgres

# OU subir aplicação completa (quando Dockerfile estiver pronto)
docker-compose up -d
```

---

## 🔧 Scripts Úteis

```bash
# Desenvolvimento
npm run start:dev       # Inicia com hot reload
npm run build           # Compila TypeScript
npm run start:prod      # Inicia modo produção

# Testes
npm test                # Testes unitários
npm run test:cov        # Coverage report
npm run test:e2e        # Testes E2E

# Linting
npm run lint            # Verifica código
npm run format          # Formata código

# Prisma
npx prisma studio       # Interface visual do banco
npx prisma migrate dev  # Cria nova migration
npx prisma db push      # Sincroniza schema (dev only)
npx prisma db seed      # Popular banco de dados
```

---

## 🚨 Troubleshooting

### Erro de conexão com banco?
```bash
# Verifique se PostgreSQL está rodando
docker ps

# Verifique a URL no .env
echo $DATABASE_URL

# Teste conexão
npx prisma db push
```

### Erro de JWT?
```bash
# Verifique se JWT_SECRET está configurado
echo $JWT_SECRET

# Regenere um secret seguro
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Porta 3000 já em uso?
```bash
# Altere PORT no .env
PORT=3001

# Ou mate o processo
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

---

## 📖 Documentação Completa

- [README.md](../README.md) - Visão geral do projeto
- [ENTERPRISE-FEATURES.md](ENTERPRISE-FEATURES.md) - Features enterprise
- [COMPLETED-FEATURES.md](COMPLETED-FEATURES.md) - Status completo
- [CI-CD.md](CI-CD.md) - Pipeline de CI/CD

---

## 🎯 Próximos Passos

1. ✅ Explore a documentação Swagger
2. ✅ Teste todos os endpoints
3. ✅ Crie um fluxo completo: usuário → livro → empréstimo → devolução
4. ✅ Rode os testes e veja a cobertura
5. ✅ Customize e expanda para seu caso de uso

---

**Dúvidas?** Consulte a [documentação completa](../README.md) ou abra uma issue!
