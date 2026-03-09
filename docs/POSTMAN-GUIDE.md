# 📮 Postman Collection - Library Management System

Collection completa do Postman com **40+ endpoints** organizados por módulo, prontos para uso!

## 📦 Conteúdo

- **`postman-collection.json`** - Collection completa com todas as requisições e variáveis
- **Este README** - Guia de uso

## 🚀 Como Importar

### Importar a Collection

1. Abra o Postman
2. Clique em **Import** (canto superior esquerdo)
3. Selecione o arquivo **`postman-collection.json`**
4. Clique em **Import**

✅ **Pronto!** Todas as variáveis já vêm configuradas dentro da collection, isoladas e sem afetar outras collections!

## 📚 Estrutura da Collection

A collection está organizada em **7 módulos**:

```
📁 Library Management System - NestJS
├── 📁 Auth (4 endpoints)
│   ├── Register (Public)
│   ├── Login (Public) ← Comece por aqui!
│   ├── Refresh Token (Public)
│   └── Get Profile (Protected)
│
├── 📁 Books (5 endpoints)
│   ├── Create Book (ADMIN/LIBRARIAN)
│   ├── List Books (Public)
│   ├── Get Book by ID (Public)
│   ├── Update Book (ADMIN/LIBRARIAN)
│   └── Delete Book (ADMIN/LIBRARIAN)
│
├── 📁 Authors (5 endpoints)
│   ├── Create Author (ADMIN/LIBRARIAN)
│   ├── List Authors (Public)
│   ├── Get Author by ID (Public)
│   ├── Update Author (ADMIN/LIBRARIAN)
│   └── Delete Author (ADMIN/LIBRARIAN)
│
├── 📁 Categories (5 endpoints)
│   ├── Create Category (ADMIN/LIBRARIAN)
│   ├── List Categories (Public)
│   ├── Get Category by ID (Public)
│   ├── Update Category (ADMIN/LIBRARIAN)
│   └── Delete Category (ADMIN/LIBRARIAN)
│
├── 📁 Loans (6 endpoints)
│   ├── Create Loan (ADMIN/LIBRARIAN)
│   ├── List Loans (ADMIN/LIBRARIAN)
│   ├── Get Loan by ID (ADMIN/LIBRARIAN)
│   ├── Get User Loan Stats (ADMIN/LIBRARIAN)
│   ├── Return Book (ADMIN/LIBRARIAN)
│   └── Renew Loan (ADMIN/LIBRARIAN)
│
├── 📁 Reservations (6 endpoints)
│   ├── Create Reservation (ADMIN/LIBRARIAN)
│   ├── List Reservations (ADMIN/LIBRARIAN)
│   ├── Get Reservation by ID (ADMIN/LIBRARIAN)
│   ├── Get Book Queue (ADMIN/LIBRARIAN)
│   ├── Cancel Reservation (ADMIN/LIBRARIAN)
│   └── Fulfill Reservation (ADMIN/LIBRARIAN)
│
└── 📁 Health (3 endpoints)
    ├── Health Check Complete (Public)
    ├── Liveness Probe (Public)
    └── Readiness Probe (Public)
```

## 🎯 Como Usar

### Passo 1: Iniciar a Aplicação

```bash
# Subir o banco de dados
docker-compose up -d

# Rodar a aplicação
npm run start:dev
```

A API estará disponível em: **http://localhost:3000**

### Passo 2: Fazer Login

1. Abra a collection no Postman
2. Vá para **Auth → Login (Public)**
3. Clique em **Send**

**✅ Magic!** Os tokens serão salvos automaticamente nas variáveis da collection:
- `accessToken` - Usado automaticamente em todas as requisições protegidas
- `refreshToken` - Para renovar quando o access token expirar
- `userId` - ID do usuário logado
- `userRole` - Papel do usuário (MEMBER, LIBRARIAN, ADMIN)

> **💡 Dica:** Variáveis da collection são isoladas e não afetam outras collections do Postman!

### Passo 3: Testar os Endpoints

Agora você pode usar qualquer endpoint! Exemplos:

**Públicos (não requerem autenticação):**
- `Books → List Books` - Ver catálogo
- `Authors → List Authors` - Ver autores
- `Categories → List Categories` - Ver categorias

**Protegidos (usam o token automaticamente):**
- `Books → Create Book` - Criar livro (requer ADMIN/LIBRARIAN)
- `Loans → Create Loan` - Fazer empréstimo
- `Reservations → Create Reservation` - Fazer reserva

## 🔐 Autenticação Automática

A collection está configurada para **gerenciar tokens automaticamente**:

### Como Funciona?

1. **Ao fazer Login/Register:**
   - Script automático captura os tokens
   - Salva nas variáveis da collection (isoladas!)
   - Você não precisa copiar/colar nada!

2. **Ao usar endpoints protegidos:**
   - Authorization é configurado como `Bearer {{accessToken}}`
   - Token é enviado automaticamente
   - Você só precisa clicar em Send!

3. **Quando o token expira:**
   - Vá em `Auth → Refresh Token`
   - Novo token é salvo automaticamente
   - Continue usando os endpoints normalmente

> **🔒 Isolamento Total:** As variáveis desta collection não afetam nem são afetadas por outras collections do seu Postman!

### Ver Tokens Salvos

1. Clique com botão direito na collection **"Library Management System - NestJS"**
2. Selecione **Edit**
3. Vá na aba **Variables**
4. `accessToken` e `refreshToken` estarão preenchidos após o login

Ou simplesmente:
1. Clique no ícone de **olho** 👁️ no canto superior direito
2. Selecione a aba **Collection Variables**

## 📝 Exemplos de Uso

### Exemplo 1: Criar um Livro

```
1. Faça login (Auth → Login)
2. Vá em Books → Create Book
3. Já tem um body de exemplo pronto!
4. Clique em Send
```

**Body de exemplo já incluído:**
```json
{
  "title": "Clean Code",
  "isbn": "978-0132350884",
  "description": "Um guia prático para escrever código limpo",
  "totalCopies": 5,
  "publicationYear": 2008,
  "categoryId": 1,
  "authorIds": [1, 2]
}
```

### Exemplo 2: Fazer um Empréstimo

```
1. Vá em Loans → Create Loan
2. Altere userId e bookId no body se necessário
3. Clique em Send
```

**Body:**
```json
{
  "userId": 1,
  "bookId": 1
}
```

### Exemplo 3: Filtrar Livros Disponíveis

```
1. Vá em Books → List Books
2. Na aba Query Params, habilite "available"
3. Clique em Send
```

Os filtros já estão configurados, basta ativar os que quiser!

## 🎨 Filtros e Query Parameters

Muitos endpoints têm **filtros pré-configurados** que você pode ativar:

**Books → List Books:**
- ✅ `search` - Buscar por título/ISBN
- ✅ `categoryId` - Filtrar por categoria
- ✅ `authorId` - Filtrar por autor
- ✅ `available` - Apenas disponíveis
- ✅ `yearFrom` / `yearTo` - Filtrar por ano
- ✅ `sortBy` / `sortOrder` - Ordenação
- ✅ `page` / `limit` - Paginação

**Como usar:**
1. Vá na aba **Params** da requisição
2. Marque o checkbox dos filtros que quer usar
3. Altere os valores se necessário
4. Clique em Send

## 🔄 Renovar Token Expirado

Quando o `accessToken` expirar (após 1 hora):

```
1. Vá em Auth → Refresh Token
2. O body já está configurado com {{refreshToken}}
3. Clique em Send
4. Novo token salvo automaticamente!
```

## 👥 Diferentes Papéis (Roles)

Crie usuários com diferentes papéis para testar permissões:

### Member (Padrão ao registrar)
```json
{
  "name": "João Silva",
  "email": "member@example.com",
  "password": "senha123"
}
```

### Librarian (Criar via seed ou admin)
- Pode gerenciar livros, autores, categorias
- Pode criar empréstimos e reservas

### Admin (Criar via seed)
- Acesso total ao sistema
- Pode gerenciar usuários e papéis

## 🛠️ Variáveis da Collection

Variáveis disponíveis (isoladas nesta collection):

| Variável | Descrição | Valor Padrão |
|----------|-----------|--------------||
| `baseURL` | URL da API | `http://localhost:3000` |
| `accessToken` | Token JWT (salvo automaticamente) | - |
| `refreshToken` | Token de refresh (salvo automaticamente) | - |
| `userId` | ID do usuário logado | - |
| `userRole` | Papel do usuário (MEMBER/LIBRARIAN/ADMIN) | - |
| `adminEmail` | Email do admin (pré-configurado) | `admin@library.com` |
| `adminPassword` | Senha do admin (pré-configurado) | `admin123` |
| `librarianEmail` | Email do librarian (pré-configurado) | `librarian@library.com` |
| `librarianPassword` | Senha do librarian (pré-configurado) | `librarian123` |
| `memberEmail` | Email do membro (pré-configurado) | `member@library.com` |
| `memberPassword` | Senha do membro (pré-configurado) | `member123` |

### Alterar a URL Base

Se a API estiver em outra porta ou servidor:

1. Clique com botão direito na collection
2. Selecione **Edit → Variables**
3. Altere o valor de `baseURL`
4. Exemplo: `http://localhost:4000` ou `https://api.production.com`

## 📊 Status Codes

A API retorna os seguintes status codes:

| Code | Significado | Quando Ocorre |
|------|-------------|---------------|
| **200** | OK | Sucesso em GET, PATCH (alguns) |
| **201** | Created | Recurso criado com sucesso (POST) |
| **204** | No Content | Recurso deletado (DELETE) |
| **400** | Bad Request | Dados inválidos, validação falhou |
| **401** | Unauthorized | Token inválido ou ausente |
| **403** | Forbidden | Sem permissão (role insuficiente) |
| **404** | Not Found | Recurso não encontrado |
| **409** | Conflict | Duplicação (ex: email já existe) |
| **500** | Server Error | Erro interno do servidor |

## 🧪 Testes Automáticos

A collection inclui **scripts de teste automáticos** que:

✅ Capturam tokens automaticamente no login  
✅ Salvam variáveis de ambiente  
✅ Validam respostas (em desenvolvimento)

### Ver Console de Testes

1. Clique em **Console** (parte inferior do Postman)
2. Veja logs dos scripts executados
3. Útil para debugging

## 🎓 Dicas de Uso

### 1. Ordem Recomendada para Testar

```
1. Auth → Login (use {{memberEmail}} e {{memberPassword}} no body)
2. Categories → Create Category
3. Authors → Create Author
4. Books → Create Book
5. Loans → Create Loan
6. Loans → Return Book
7. Reservations → Create Reservation
```

> **💡 Dica:** Use as credenciais pré-configuradas nas variáveis (adminEmail/Password, librarianEmail/Password, memberEmail/Password)

### 2. Usar Variáveis nos Bodies

Você pode usar variáveis em qualquer lugar:

```json
{
  "userId": {{userId}},
  "bookId": 1
}
```

### 3. Duplicar Requisições

Para criar variações:
1. Clique com botão direito na requisição
2. **Duplicate**
3. Renomeie e altere o body

### 4. Organizar em Folders

Você pode criar subpastas:
1. Clique direito em uma pasta
2. **Add Folder**
3. Organize como preferir

## 🐛 Troubleshooting

### Erro 401 - Unauthorized

**Causa:** Token expirado ou inválido

**Solução:**
1. Faça login novamente (Auth → Login)
2. Ou renove o token (Auth → Refresh Token)

### Erro 403 - Forbidden

**Causa:** Usuário não tem permissão (role insuficiente)

**Solução:**
1. Faça login com usuário ADMIN ou LIBRARIAN
2. Ou crie um usuário com role adequado

### Requisição não envia token

**Causa:** Authorization não configurado

**Solução:**
1. Vá na aba **Authorization**
2. Selecione **Type: Bearer Token**
3. Token: `{{accessToken}}`

### Variáveis não aparecem

**Causa:** Olhando no lugar errado

**Solução:**
1. Clique no ícone de **olho** 👁️ no canto superior direito
2. Selecione a aba **Collection Variables** (não Environment Variables)
3. Ou clique com botão direito na collection → Edit → Variables

## 📖 Documentação Adicional

- **Swagger UI:** http://localhost:3000/api/docs
- **Regras de Negócio:** [docs/BUSINESS-DOMAIN.md](docs/BUSINESS-DOMAIN.md)
- **Quick Start:** [docs/QUICK-START.md](docs/QUICK-START.md)
- **Enterprise Features:** [docs/ENTERPRISE-FEATURES.md](docs/ENTERPRISE-FEATURES.md)

## 🎉 Pronto para Usar!

Agora você tem:

✅ **40+ endpoints** prontos para uso  
✅ **Autenticação automática** com JWT  
✅ **Bodies de exemplo** em todas as requisições  
✅ **Filtros pré-configurados** para facilitar testes  
✅ **Variáveis de ambiente** gerenciadas automaticamente  
✅ **Documentação completa** em cada endpoint  

**Comece testando:**
1. `Auth → Login` para autenticar
2. `Books → List Books` para ver o catálogo
3. Explore os outros módulos!

---

**Criado com ❤️ para facilitar o desenvolvimento e testes da API**
