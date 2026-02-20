# 📚 Domínio de Negócio - Sistema de Gerenciamento de Biblioteca

> **Documentação do Domínio de Negócio**  
> Esta documentação descreve as regras, requisitos e políticas do sistema de gerenciamento de biblioteca, focando nos aspectos de negócio e não nos detalhes técnicos de implementação.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Contexto de Negócio](#contexto-de-negócio)
- [Entidades do Domínio](#entidades-do-domínio)
- [Papéis e Permissões](#papéis-e-permissões)
- [Regras de Negócio](#regras-de-negócio)
- [Casos de Uso](#casos-de-uso)
- [Fluxos Principais](#fluxos-principais)
- [Políticas e Restrições](#políticas-e-restrições)
- [Cenários de Exceção](#cenários-de-exceção)
- [Glossário](#glossário)

---

## 🎯 Visão Geral

O **Sistema de Gerenciamento de Biblioteca** é uma solução digital para administrar o acervo, empréstimos, reservas e multas de uma biblioteca. O sistema permite que membros emprestem livros, façam reservas quando os livros estão indisponíveis, e gerenciem suas devoluções, enquanto bibliotecários e administradores controlam o acervo e monitoram as operações.

### Objetivos do Negócio

1. **Automatizar** o processo de empréstimo e devolução de livros
2. **Controlar** o acervo e disponibilidade de livros em tempo real
3. **Gerenciar** filas de espera quando livros não estão disponíveis
4. **Aplicar** políticas de multas por atraso de forma automática
5. **Impedir** abusos através de limites e validações
6. **Facilitar** acesso à informação sobre livros, autores e categorias

---

## 🏢 Contexto de Negócio

### Problema que Resolve

Bibliotecas tradicionais enfrentam desafios como:
- Controle manual de empréstimos é propenso a erros
- Dificuldade em saber a disponibilidade de livros em tempo real
- Falta de sistema de fila para livros populares
- Cálculo manual de multas por atraso
- Dificuldade em rastrear histórico de empréstimos

### Solução Proposta

Um sistema web que:
- Registra todos os empréstimos digitalmente
- Atualiza disponibilidade automaticamente
- Gerencia fila de reservas (FIFO - First In, First Out)
- Calcula multas automaticamente com base em dias de atraso
- Mantém histórico completo de todas as operações
- Impede novos empréstimos quando há pendências

---

## 🗂️ Entidades do Domínio

### 1. **Usuário (User)**

Representa qualquer pessoa que utiliza o sistema.

**Atributos Principais:**
- Nome completo
- E-mail (usado para login, deve ser único)
- Senha (armazenada de forma criptografada)
- Papel/Função (ADMIN, LIBRARIAN, MEMBER)

**Capacidades:**
- Fazer login no sistema
- Emprestar livros (se MEMBER)
- Fazer reservas
- Visualizar histórico pessoal
- Pagar multas

---

### 2. **Livro (Book)**

Representa um título no acervo da biblioteca.

**Atributos Principais:**
- Título
- ISBN (identificador único internacional)
- Descrição
- Ano de publicação
- Quantidade total de exemplares
- Quantidade de exemplares disponíveis
- Categoria
- Autores (um livro pode ter vários autores)

**Estados Possíveis:**
- **Disponível**: Pelo menos uma cópia disponível para empréstimo
- **Indisponível**: Todas as cópias emprestadas
- **Parcialmente disponível**: Algumas cópias emprestadas, outras disponíveis

**Regras:**
- ISBN deve ser único no sistema
- Total de cópias não pode ser negativo
- Disponíveis não pode ser maior que total
- Disponíveis é decrementado em empréstimo, incrementado em devolução

---

### 3. **Autor (Author)**

Representa o autor de um ou mais livros.

**Atributos Principais:**
- Nome
- Biografia (opcional)

**Características:**
- Um autor pode ter escrito vários livros
- Um livro pode ter vários autores (coautoria)
- Relacionamento muitos-para-muitos com Livros

---

### 4. **Categoria (Category)**

Classifica os livros por assunto/gênero.

**Atributos Principais:**
- Nome (deve ser único)
- Descrição (opcional)

**Exemplos:**
- Ficção Científica
- Romance
- Biografia
- Tecnologia
- História
- Autoajuda

**Regras:**
- Nome deve ser único
- Um livro pertence a apenas uma categoria
- Uma categoria pode ter vários livros

---

### 5. **Empréstimo (Loan)**

Representa o ato de emprestar um livro a um usuário.

**Atributos Principais:**
- Usuário que pegou emprestado
- Livro emprestado
- Data do empréstimo
- Data de vencimento (prazo para devolução)
- Data de devolução real (null enquanto não devolvido)
- Status (ACTIVE, RETURNED, OVERDUE)
- Contador de renovações

**Estados:**
- **ACTIVE**: Empréstimo em andamento, ainda não vencido
- **OVERDUE**: Empréstimo vencido e não devolvido
- **RETURNED**: Livro devolvido

**Ciclo de Vida:**
1. Criado ao emprestar: status = ACTIVE
2. Se passar da data de vencimento sem devolução: status = OVERDUE
3. Ao devolver: status = RETURNED, data de devolução preenchida

---

### 6. **Reserva (Reservation)**

Representa a intenção de um usuário de pegar um livro quando ele ficar disponível.

**Atributos Principais:**
- Usuário que fez a reserva
- Livro reservado
- Data da reserva
- Status (PENDING, CONFIRMED, CANCELLED, FULFILLED)

**Estados:**
- **PENDING**: Na fila, aguardando livro ficar disponível
- **CONFIRMED**: Livro disponível, usuário pode retirá-lo
- **CANCELLED**: Reserva cancelada pelo usuário
- **FULFILLED**: Reserva se transformou em empréstimo

**Características:**
- Fila é ordenada por ordem de chegada (FIFO)
- Reserva só pode ser feita se livro estiver indisponível
- Usuário não pode ter reserva duplicada do mesmo livro
- Usuário não pode reservar livro que já pegou emprestado

---

### 7. **Multa (Fine)**

Representa penalidade financeira por atraso ou dano.

**Atributos Principais:**
- Usuário responsável
- Empréstimo relacionado
- Valor em reais
- Motivo (atraso, dano ao livro, perda do livro)
- Status (PENDING, PAID, CANCELLED)
- Data de pagamento

**Tipos de Multa:**
- **Atraso**: Calculada automaticamente (R$ 2,00 por dia de atraso)
- **Dano**: Avaliada manualmente por bibliotecário
- **Perda**: Valor do livro + taxa administrativa

**Regras:**
- Multas pendentes impedem novos empréstimos
- Multa de atraso é criada automaticamente na devolução
- Cálculo: `dias_atraso × R$ 2,00`

---

## 👥 Papéis e Permissões

### 1. MEMBER (Membro/Leitor)

**O que pode fazer:**
- ✅ Fazer login
- ✅ Buscar livros no catálogo
- ✅ Ver detalhes de livros, autores, categorias
- ✅ Emprestar livros (até 3 simultâneos)
- ✅ Renovar empréstimos (máximo 2 vezes cada)
- ✅ Fazer reservas de livros indisponíveis
- ✅ Cancelar suas próprias reservas
- ✅ Ver histórico de empréstimos e reservas
- ✅ Ver suas multas
- ✅ Registrar pagamento de multas

**O que NÃO pode fazer:**
- ❌ Adicionar/editar/remover livros
- ❌ Adicionar/editar autores ou categorias
- ❌ Ver dados de outros usuários
- ❌ Cancelar multas
- ❌ Modificar empréstimos de outros

---

### 2. LIBRARIAN (Bibliotecário)

**Herda todas as permissões de MEMBER, mais:**
- ✅ Criar, editar e remover livros
- ✅ Gerenciar autores
- ✅ Gerenciar categorias
- ✅ Ver todos os empréstimos (de todos os usuários)
- ✅ Forçar devolução de livros
- ✅ Ver todas as reservas
- ✅ Criar multas manualmente (dano, perda)
- ✅ Cancelar multas em casos excepcionais

**O que NÃO pode fazer:**
- ❌ Criar/editar/remover outros usuários
- ❌ Alterar permissões de usuários
- ❌ Acessar dados de autenticação de outros

---

### 3. ADMIN (Administrador)

**Acesso total ao sistema:**
- ✅ Todas as permissões de LIBRARIAN
- ✅ Criar, editar e remover usuários
- ✅ Alterar papéis de usuários
- ✅ Visualizar relatórios e estatísticas
- ✅ Configurar regras do sistema (via código/config)
- ✅ Acesso aos endpoints de saúde do sistema

---

## 📏 Regras de Negócio

### RN001: Limite de Empréstimos Simultâneos

**Regra:** Um usuário pode ter no máximo **3 empréstimos ativos** simultaneamente.

**Justificativa:** Evitar acúmulo excessivo de livros por uma única pessoa.

**Validação:** Antes de criar empréstimo, verificar:
```
COUNT(empréstimos WHERE userId = X AND status = 'ACTIVE') < 3
```

**Exceção:** Nenhuma. Regra aplicada a todos os usuários.

---

### RN002: Prazo Padrão de Empréstimo

**Regra:** Empréstimos têm prazo padrão de **14 dias corridos**.

**Cálculo:**
```
dataVencimento = dataEmpréstimo + 14 dias
```

**Flexibilidade:** Bibliotecários podem definir prazo customizado ao criar empréstimo manualmente.

---

### RN003: Limite de Renovações

**Regra:** Cada empréstimo pode ser renovado no máximo **2 vezes**.

**Justificativa:** Dar chance a outros usuários interessados no livro.

**Validação:** 
```
renewalCount < 2
```

**Efeito da Renovação:**
- Adiciona 14 dias ao prazo atual
- Incrementa contador de renovações
- Não pode renovar se empréstimo já está atrasado
- Não pode renovar se há reservas pendentes para o livro

---

### RN004: Cálculo de Multa por Atraso

**Regra:** Multa de **R$ 2,00 por dia** de atraso.

**Cálculo:**
```
diasAtraso = dataDevoluçãoReal - dataVencimento
valorMulta = diasAtraso × R$ 2,00
```

**Aplicação:** Automática no momento da devolução, se houver atraso.

**Exemplo:**
- Vencimento: 01/02/2026
- Devolução: 08/02/2026
- Dias de atraso: 7
- Multa: R$ 14,00

---

### RN005: Bloqueio por Pendências

**Regra:** Usuários com pendências **NÃO podem fazer novos empréstimos**.

**Pendências que bloqueiam:**
1. Empréstimos atrasados (status = OVERDUE)
2. Multas não pagas (status = PENDING)

**Validação:** Antes de criar empréstimo, verificar:
```
COUNT(loans WHERE userId = X AND status = 'OVERDUE') = 0
COUNT(fines WHERE userId = X AND status = 'PENDING') = 0
```

**Mensagem ao usuário:**
- "Você possui [N] empréstimo(s) atrasado(s). Devolva antes de fazer novo empréstimo."
- "Você possui [N] multa(s) pendente(s). Pague antes de fazer novo empréstimo."

---

### RN006: Reserva somente para Livros Indisponíveis

**Regra:** Reserva só pode ser criada se **livro está completamente indisponível**.

**Validação:**
```
book.availableCopies = 0
```

**Justificativa:** Se há cópias disponíveis, usuário deve fazer empréstimo direto.

**Mensagem ao usuário:**
- "Livro 'X' está disponível (Y cópia(s)). Não é necessário reservar. Realize o empréstimo diretamente."

---

### RN007: Fila de Reservas (FIFO)

**Regra:** Reservas são atendidas por **ordem de chegada** (First In, First Out).

**Funcionamento:**
1. Usuários fazem reservas enquanto livro está indisponível
2. Quando uma cópia é devolvida, **primeira reserva da fila** é confirmada
3. Usuário tem prioridade para pegar o livro

**Ordenação:** Por `reservationDate` (data de criação da reserva).

**Características:**
- Posição na fila é informada ao criar reserva
- Reserva pode ser cancelada a qualquer momento
- Se cancelada, próxima da fila assume a posição

---

### RN008: Prevenção de Reserva Duplicada

**Regra:** Usuário **não pode ter múltiplas reservas ativas** do mesmo livro.

**Validação:**
```
NOT EXISTS (
  reservations WHERE userId = X AND bookId = Y AND status = 'PENDING'
)
```

**Justificativa:** Um usuário não precisa de múltiplas posições na fila do mesmo livro.

---

### RN009: Prevenção de Reserva de Livro Emprestado

**Regra:** Usuário **não pode reservar livro que já possui emprestado**.

**Validação:**
```
NOT EXISTS (
  loans WHERE userId = X AND bookId = Y AND status = 'ACTIVE'
)
```

**Justificativa:** Não faz sentido reservar algo que já possui.

---

### RN010: Atualização Automática de Disponibilidade

**Regra:** Quantidade de cópias disponíveis é atualizada **automaticamente**:

**Ao emprestar:**
```
book.availableCopies = book.availableCopies - 1
```

**Ao devolver:**
```
book.availableCopies = book.availableCopies + 1
```

**Garantias:**
- Operações são atômicas (transações)
- Nunca pode ficar negativo
- Nunca pode exceder total de cópias

---

### RN011: Confirmação Automática de Reserva

**Regra:** Quando livro é devolvido e há reservas, **primeira reserva é confirmada automaticamente**.

**Fluxo:**
1. Livro devolvido → availableCopies incrementado
2. Sistema verifica se há reservas PENDING
3. Se sim, pega a mais antiga (`ORDER BY reservationDate ASC LIMIT 1`)
4. Muda status para CONFIRMED
5. (Idealmente) Notificação ao usuário

**Efeito:**
- Usuário com reserva confirmada tem prioridade
- Outros usuários não podem emprestar até reserva expirar ou ser atendida

---

## 🎬 Casos de Uso

### CU01: Cadastrar Livro no Acervo

**Ator:** Bibliotecário ou Admin

**Pré-condições:**
- Usuário está autenticado
- Usuário tem papel LIBRARIAN ou ADMIN

**Fluxo Principal:**
1. Bibliotecário acessa interface de cadastro de livros
2. Preenche: título, ISBN, descrição, ano, total de cópias, categoria
3. Adiciona um ou mais autores
4. Sistema valida ISBN único
5. Sistema cria livro com availableCopies = totalCopies
6. Livro é adicionado ao catálogo

**Pós-condições:**
- Livro disponível para empréstimo
- Livro aparece em buscas

**Fluxo Alternativo:**
- ISBN duplicado → Sistema rejeita com erro

---

### CU02: Emprestar Livro

**Ator:** Membro (para si) ou Bibliotecário (para qualquer usuário)

**Pré-condições:**
- Usuário autenticado
- Livro existe e está disponível (availableCopies > 0)

**Fluxo Principal:**
1. Usuário busca livro desejado
2. Verifica disponibilidade
3. Solicita empréstimo
4. Sistema valida regras:
   - ✅ Menos de 3 empréstimos ativos
   - ✅ Sem empréstimos atrasados
   - ✅ Sem multas pendentes
5. Sistema cria empréstimo:
   - Data de vencimento = hoje + 14 dias
   - Status = ACTIVE
6. Sistema decrementa availableCopies
7. Empréstimo confirmado

**Pós-condições:**
- Empréstimo ativo registrado
- Livro decrementado

**Fluxos Alternativos:**
- Limite atingido → Rejeita com mensagem
- Livro indisponível → Sugere fazer reserva
- Pendências → Bloqueia e lista pendências

---

### CU03: Devolver Livro

**Ator:** Membro (seus empréstimos) ou Bibliotecário (qualquer empréstimo)

**Pré-condições:**
- Empréstimo existe e está ativo

**Fluxo Principal:**
1. Usuário seleciona empréstimo a devolver
2. Informa data de devolução (padrão: hoje)
3. Sistema calcula se há atraso:
   - Se dataDevoluçãoReal > dataVencimento → Há atraso
4. Sistema atualiza empréstimo:
   - returnDate = data informada
   - status = RETURNED
5. Sistema incrementa availableCopies do livro
6. **Se há atraso:** Sistema cria multa automaticamente
7. **Se há reservas:** Sistema confirma próxima reserva da fila
8. Devolução confirmada

**Pós-condições:**
- Empréstimo marcado como devolvido
- Livro disponível novamente
- Multa criada se atrasado
- Reserva confirmada se houver fila

---

### CU04: Renovar Empréstimo

**Ator:** Membro (seu empréstimo) ou Bibliotecário (qualquer)

**Pré-condições:**
- Empréstimo existe e está ativo
- renewalCount < 2
- Empréstimo não está atrasado
- Não há reservas pendentes do livro

**Fluxo Principal:**
1. Usuário seleciona empréstimo a renovar
2. Sistema valida condições
3. Sistema estende prazo:
   - dueDate = dueDate + 14 dias
   - renewalCount = renewalCount + 1
4. Renovação confirmada

**Pós-condições:**
- Prazo estendido
- Contador de renovações incrementado

**Fluxos Alternativos:**
- Limite de renovações → Rejeita
- Empréstimo atrasado → Rejeita
- Há reservas → Rejeita para dar chance a outros

---

### CU05: Fazer Reserva

**Ator:** Membro

**Pré-condições:**
- Livro existe
- Livro está indisponível (availableCopies = 0)
- Usuário não tem reserva ativa do mesmo livro
- Usuário não tem empréstimo ativo do mesmo livro

**Fluxo Principal:**
1. Usuário busca livro desejado
2. Verifica que está indisponível
3. Solicita reserva
4. Sistema valida regras
5. Sistema calcula posição na fila
6. Sistema cria reserva:
   - status = PENDING
   - reservationDate = agora
7. Sistema informa posição na fila
8. Reserva confirmada

**Pós-condições:**
- Reserva na fila
- Usuário notificado da posição

**Fluxos Alternativos:**
- Livro disponível → Sistema sugere empréstimo direto
- Reserva duplicada → Rejeita
- Já possui emprestado → Rejeita

---

### CU06: Cancelar Reserva

**Ator:** Membro (sua reserva) ou Bibliotecário (qualquer)

**Pré-condições:**
- Reserva existe e está PENDING ou CONFIRMED

**Fluxo Principal:**
1. Usuário seleciona reserva a cancelar
2. Sistema atualiza status = CANCELLED
3. **Se havia outras reservas na fila:** Posições são recalculadas
4. Cancelamento confirmado

**Pós-condições:**
- Reserva cancelada
- Fila atualizada

---

### CU07: Buscar Livros com Filtros

**Ator:** Qualquer usuário (sem autenticação necessária para busca)

**Fluxo Principal:**
1. Usuário acessa catálogo de livros
2. Aplica filtros opcionais:
   - Busca por texto (título)
   - Categoria
   - Autor
   - Ano de publicação (de/até)
   - Disponibilidade (disponíveis ou todos)
3. Sistema retorna lista paginada
4. Para cada livro mostra:
   - Título, autores, categoria
   - Ano de publicação
   - Cópias disponíveis / Total
   - Status: Disponível ou Indisponível

**Pós-condições:**
- Lista de livros exibida

---

### CU08: Pagar Multa

**Ator:** Membro (suas multas) ou Bibliotecário (qualquer)

**Pré-condições:**
- Multa existe e status = PENDING

**Fluxo Principal:**
1. Usuário visualiza suas multas pendentes
2. Seleciona multa a pagar
3. Confirma pagamento
4. Sistema atualiza:
   - status = PAID
   - paidAt = agora
5. Pagamento confirmado

**Pós-condições:**
- Multa marcada como paga
- Usuário pode fazer novos empréstimos

---

## 🔄 Fluxos Principais

### Fluxo 1: Ciclo de Vida de um Livro Popular

```
1. Bibliotecário cadastra livro com 3 cópias
   → availableCopies = 3

2. Usuário A empresta
   → availableCopies = 2
   → Loan A criado (Active)

3. Usuário B empresta
   → availableCopies = 1
   → Loan B criado (Active)

4. Usuário C empresta
   → availableCopies = 0
   → Loan C criado (Active)
   → Livro agora está INDISPONÍVEL

5. Usuário D tenta emprestar
   → Sistema rejeita (availableCopies = 0)
   → Sistema sugere fazer reserva

6. Usuário D faz reserva
   → Reservation D criada (Pending, posição 1)

7. Usuário E faz reserva
   → Reservation E criada (Pending, posição 2)

8. Usuário A devolve (no prazo)
   → Loan A atualizado (Returned)
   → availableCopies = 1
   → Sistema verifica reservas
   → Reservation D confirmada (Confirmed)
   → Sistema notifica Usuário D

9. Usuário D pega livro emprestado
   → Reservation D cumprida (Fulfilled)
   → Loan D criado (Active)
   → availableCopies = 0

10. Usuário B devolve (atrasado 5 dias)
    → Loan B atualizado (Returned)
    → availableCopies = 1
    → Multa criada: 5 × R$ 2,00 = R$ 10,00
    → Reservation E confirmada (Confirmed)
    → Sistema notifica Usuário E
```

---

### Fluxo 2: Empréstimo com Atraso e Bloqueio

```
1. Usuário tem empréstimo com vencimento 01/02/2026

2. Passa do prazo sem devolver
   → Sistema marca status = OVERDUE

3. Usuário tenta fazer novo empréstimo
   → Sistema valida regras
   → Detected: 1 empréstimo atrasado
   → BLOQUEIO: Rejeita novo empréstimo
   → Mensagem: "Devolva livros atrasados primeiro"

4. Usuário devolve livro atrasado (05/02/2026)
   → 4 dias de atraso
   → Loan status = RETURNED
   → Multa criada: R$ 8,00 (pendente)

5. Usuário tenta fazer novo empréstimo
   → Sistema valida regras
   → Detected: 1 multa pendente
   → BLOQUEIO: Rejeita empréstimo
   → Mensagem: "Pay multas pendentes primeiro"

6. Usuário paga multa
   → Fine status = PAID

7. Usuário tenta fazer novo empréstimo
   → Sistema valida regras
   → ✅ Sem empréstimos atrasados
   → ✅ Sem multas pendentes
   → ✅ Aprovado!
```

---

### Fluxo 3: Renovação com Restrições

```
1. Usuário empresta livro (14 dias)
   → renewalCount = 0

2. Dia 12: Usuário renova (ainda no prazo)
   → dueDate estendido (+14 dias)
   → renewalCount = 1
   → ✅ Sucesso

3. Dia 24: Usuário renova novamente
   → renewalCount = 2
   → ✅ Sucesso (última renovação permitida)

4. Dia 36: Usuário tenta renovar terceira vez
   → renewalCount = 2 (já está no limite)
   → ❌ BLOQUEIO: "Limite de renovações atingido"
   → Usuário deve devolver

5. Usuário não devolve e fica atrasado
   → status = OVERDUE

6. Quando finalmente devolve (dia 40, 2 dias atrasado)
   → Multa: R$ 4,00
```

---

## 🚫 Políticas e Restrições

### Política de Privacidade de Dados

**Regra:** Usuários só veem seus próprios dados.

**Exceções:**
- Bibliotecários veem empréstimos/reservas de todos
- Admins têm acesso total

**Implementação:** Guards verificam papel e ownership.

---

### Política de Segurança de Senhas

**Requisitos:**
- Mínimo 6 caracteres
- Armazenada com hash bcrypt
- Nunca retornada em APIs

---

### Restrições de Integridade

**Cascata de Exclusão:**
- Ao excluir Livro → BookAuthors são excluídos
- Empréstimos e reservas são mantidos (histórico)

**Unicidade:**
- E-mail de usuário deve ser único
- ISBN de livro deve ser único
- Nome de categoria deve ser único

---

### Política de Rate Limiting

**Regra:** Máximo **10 requisições por minuto** por IP.

**Justificativa:** Prevenir abuso e ataques DDoS.

**Exceção:** Endpoints públicos podem ter limite maior.

---

## ⚠️ Cenários de Exceção

### Exceção 1: Tentativa de Emprestar Livro com Reserva Confirmada

**Cenário:**
- Livro tem reserva confirmada para Usuário A
- Usuário B tenta emprestar

**Comportamento:**
- Sistema rejeita empréstimo de B
- Mensagem: "Este livro tem reserva confirmada"
- Usuário B pode fazer outra reserva (entrará na fila)

---

### Exceção 2: Livro Danificado ou Perdido

**Cenário:**
- Usuário perde livro ou o danifica

**Ação do Bibliotecário:**
1. Marca empréstimo como devolvido
2. Cria multa manual:
   - Tipo: DANO ou PERDA
   - Valor: Avaliado pelo bibliotecário
3. Atualiza totalCopies do livro (se perda permanente)

---

### Exceção 3: Devolução fora do Sistema

**Cenário:**
- Usuário devolve livro fisicamente mas sistema não registra

**Problema:**
- Livro fisicamente disponível
- Sistema mostra como emprestado
- availableCopies incorreto

**Solução:**
- Bibliotecário força devolução manualmente
- Ajusta availableCopies se necessário

---

### Exceção 4: Reserva Expirada

**Cenário:**
- Reserva confirmada mas usuário não retira livro

**Política Sugerida:** (não implementada na versão atual)
- Reserva confirmada expira em 3 dias
- Sistema cancela e confirma próxima da fila

---

### Exceção 5: Cancelamento de Multa

**Cenário:**
- Usuário questiona multa indevida
- Bibliotecário valida que foi erro

**Ação:**
- Admin ou Librarian pode cancelar multa
- Fine status = CANCELLED
- Motivo deve ser documentado (campo reason)

---

## 📖 Glossário

**Acervo:** Conjunto de todos os livros da biblioteca.

**Availability (Disponibilidade):** Estado que indica se há cópias disponíveis para empréstimo.

**Cópia:** Exemplar físico individual de um livro. Um título pode ter várias cópias.

**Empréstimo Ativo:** Empréstimo que está em andamento (livro ainda não foi devolvido).

**FIFO (First In, First Out):** Primeiro a entrar, primeiro a sair. Usado na fila de reservas.

**ISBN:** International Standard Book Number - código único que identifica livros internacionalmente.

**Multa:** Penalidade financeira aplicada por atraso, dano ou perda de livro.

**Overdue (Atrasado):** Empréstimo que passou da data de vencimento sem ser devolvido.

**Prazo:** Período de dias que o usuário tem para devolver o livro (padrão: 14 dias).

**Renovação:** Extensão do prazo de um empréstimo existente.

**Reserva:** Solicitação para pegar um livro quando ele ficar disponível.

**Reserva Confirmada:** Reserva onde o livro já está disponível e aguardando retirada do usuário.

**Status:** Estado atual de uma entidade (empréstimo, reserva, multa).

**Transação:** Operação que agrupa múltiplas ações do banco de dados, garantindo atomicidade.

---

## 📊 Regras de Cálculo

### Cálculo de Data de Vencimento

```
dataVencimento = dataEmpréstimo + 14 dias
```

**Exemplo:**
- Empréstimo: 01/02/2026
- Vencimento: 15/02/2026

---

### Cálculo de Dias de Atraso

```
diasAtraso = dataDevoluçãoReal - dataVencimento

Se diasAtraso ≤ 0: sem atraso
Se diasAtraso > 0: há atraso
```

**Exemplo:**
- Vencimento: 15/02/2026
- Devolução: 20/02/2026
- Dias de atraso: 5 dias

---

### Cálculo de Multa por Atraso

```
valorMulta = diasAtraso × R$ 2,00

Mínimo: R$ 2,00 (1 dia)
Sem máximo definido
```

---

### Cálculo de Posição na Fila de Reservas

```
posição = COUNT(reservations WHERE bookId = X AND status = 'PENDING' AND reservationDate < minhaReserva.reservationDate) + 1
```

**Ordenação:** Por `reservationDate ASC` (mais antiga primeiro).

---

## 🎯 Métricas de Negócio

### KPIs Sugeridos

1. **Taxa de Utilização do Acervo**
   ```
   (Total de Empréstimos no mês) / (Total de Livros × 30 dias) × 100
   ```

2. **Taxa de Devolução no Prazo**
   ```
   (Devoluções sem atraso) / (Total de Devoluções) × 100
   ```

3. **Taxa de Pagamento de Multas**
   ```
   (Multas pagas) / (Total de Multas) × 100
   ```

4. **Livros Mais Populares**
   ```
   TOP 10 livros por COUNT(loans + reservations)
   ```

5. **Tempo Médio de Empréstimo**
   ```
   AVG(returnDate - loanDate)
   ```

6. **Taxa de Conversão de Reservas**
   ```
   (Reservas FULFILLED) / (Total de Reservas) × 100
   ```

---

## ✅ Validações Críticas

### Antes de Criar Empréstimo

- [ ] Livro existe?
- [ ] Livro tem cópias disponíveis?
- [ ] Usuário existe?
- [ ] Usuário tem < 3 empréstimos ativos?
- [ ] Usuário não tem empréstimos atrasados?
- [ ] Usuário não tem multas pendentes?

### Antes de Renovar Empréstimo

- [ ] Empréstimo existe?
- [ ] Empréstimo está ativo?
- [ ] renewalCount < 2?
- [ ] Empréstimo não está atrasado?
- [ ] Não há reservas pendentes do livro?

### Antes de Criar Reserva

- [ ] Livro existe?
- [ ] availableCopies = 0?
- [ ] Usuário não tem reserva ativa do mesmo livro?
- [ ] Usuário não tem empréstimo ativo do mesmo livro?

### Ao Devolver Livro

- [ ] Empréstimo existe?
- [ ] Empréstimo está ativo (não devolvido)?
- [ ] Se atrasado, criar multa
- [ ] Se há reservas, confirmar próxima

---

## 🔮 Cenários Futuros (Não Implementados)

### 1. Notificações por E-mail

- Lembrete 2 dias antes do vencimento
- Alerta de reserva confirmada
- Aviso de multa criada
- Lembrete de multa pendente

### 2. Histórico de Leituras

- Usuário vê lista de todos os livros já lidos
- Estatísticas: total lido, categorias favoritas, autores favoritos

### 3. Sistema de Avaliações

- Usuários avaliam livros (1-5 estrelas)
- Comentários e resenhas
- Ranking de livros mais bem avaliados

### 4. Limite de Reservas Simultâneas

- Máximo de 5 reservas ativas por usuário

### 5. Expiração de Reservas Confirmadas

- Reserva confirmada expira em 3 dias
- Sistema cancela automaticamente e confirma próxima

### 6. Multa Progressiva

- Primeiros 7 dias: R$ 2,00/dia
- Após 7 dias: R$ 3,00/dia
- Após 30 dias: Considera perda do livro

### 7. Empréstimos de Longa Duração

- Livros acadêmicos: 30 dias
- Livros comuns: 14 dias
- Categoria define prazo padrão

---

## 📌 Conclusão

Este documento define o **domínio de negócio** do Sistema de Gerenciamento de Biblioteca, descrevendo:

- **O QUÊ** o sistema faz (entidades, casos de uso)
- **POR QUÊ** as regras existem (justificativas)
- **COMO** os processos fluem (ciclos de vida, fluxos)
- **QUANDO** ações são permitidas (validações, restrições)

Para detalhes técnicos de **implementação**, consulte:
- [ENTERPRISE-FEATURES.md](./ENTERPRISE-FEATURES.md) - Features técnicas
- [COMPLETED-FEATURES.md](./COMPLETED-FEATURES.md) - Status do projeto
- [QUICK-START.md](./QUICK-START.md) - Setup e testes

---

**Última atualização:** 20 de fevereiro de 2026  
**Versão:** 1.0  
**Autor:** Sistema de Documentação POC Learn Nest
