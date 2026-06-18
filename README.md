# CuidarBem — Serviços de Enfermagem

> Plataforma web completa para agendamento de atendimento domiciliar de enfermagem, desenvolvida para a **Enf.ª Monique Ribeiro** (COREN ativo).

---

## Visão Geral

O **CuidarBem** é um sistema web de página única (landing page) integrado a um painel administrativo, que permite a pacientes solicitarem serviços de enfermagem domiciliar e à enfermeira gerenciar os atendimentos em tempo real.

**Stack principal:**
- **Backend:** Node.js + Express.js
- **Banco de dados:** SQLite via `sql.js` (JavaScript puro, sem binários nativos)
- **Frontend:** HTML5 + CSS3 + JavaScript vanilla
- **Ícones:** Font Awesome 6.5.0
- **Tipografia:** Poppins (Google Fonts)

---

## Estrutura do Projeto

```
cuidarbem/
├── backend/
│   ├── server.js               # Servidor Express — middleware, rotas, inicialização do DB
│   ├── database.js             # sql.js: schema, seed, helpers query/run
│   ├── routes/
│   │   ├── auth.js             # POST /api/login
│   │   ├── especialidades.js   # GET  /api/especialidades
│   │   └── agendamentos.js     # CRUD /api/agendamentos
│   ├── db.sqlite               # Criado automaticamente na 1ª execução
│   └── package.json
│
├── frontend/
│   ├── index.html              # Landing page pública (hero, serviços, sobre, contato)
│   ├── admin.html              # Painel administrativo de agendamentos
│   ├── login.html              # Autenticação do painel admin
│   ├── style.css               # Estilos globais: tema, variáveis, responsivo
│   ├── script.js               # JS da landing page (formulário, serviços, máscara)
│   └── admin.js                # JS do painel (tabela, gráfico, filtros, ações)
│
├── README.md
└── TESTES.md                   # Relatório de testes automatizados
```

---

## Como Executar

### Pré-requisitos

- **Node.js v18+** instalado
- Nenhuma dependência nativa — `sql.js` roda em JavaScript puro

### 1. Instalar dependências

```bash
cd backend
npm install
```

### 2. Iniciar o servidor

```bash
node server.js
```

O servidor sobe em **http://localhost:3000** e já serve os arquivos do frontend estaticamente.

### 3. Acessar o sistema

| Página | URL |
|---|---|
| Site público | http://localhost:3000 |
| Login admin | http://localhost:3000/login.html |
| Painel admin | http://localhost:3000/admin.html |

### Resetar o banco de dados

Para recriar o banco com os dados de seed (útil após alterar `database.js`):

```bash
# Windows
del backend\db.sqlite

# macOS / Linux
rm backend/db.sqlite
```

Na próxima execução de `node server.js`, o banco é recriado automaticamente.

---

## Credenciais de Acesso

| Campo | Valor |
|---|---|
| E-mail | `admin@cuidarbem.com.br` |
| Senha | `enfermagem2026` |
| Token gerado | `cb-admin-token-2026` |

As credenciais são verificadas em `backend/routes/auth.js`.

---

## Funcionalidades

### Landing Page (`index.html`)

- **Hero section** com foto profissional da enfermeira, badges flutuantes animados e estatísticas de experiência
- **Serviços carregados dinamicamente** via API `/api/especialidades` — os cards são gerados no front a partir dos dados do banco
- **Seção "Sobre"** com certificações, diferenciais e depoimentos de pacientes
- **Formulário de agendamento** com:
  - Máscara automática de telefone `(xx) xxxxx-xxxx`
  - Validação de campos obrigatórios no frontend
  - Verificação de conflito de horário no backend (mesmo serviço + mesmo dia + mesma hora)
  - Feedback visual de sucesso/erro com toast animado
- **Modo claro/escuro** com persistência via `localStorage`
- **Menu hambúrguer** responsivo para mobile
- **Design totalmente responsivo** — 3 breakpoints (1024px, 768px, 480px)

### Painel Administrativo (`admin.html`)

- **Autenticação por token** — redireciona automaticamente para login se não autenticado
- **Cards de estatísticas** em tempo real: total, pendentes, confirmados, cancelados
- **Gráfico de barras** por serviço com altura proporcional, valor exibido acima da barra e tooltip com nome completo
- **Tabela de agendamentos** com:
  - Colunas: `#`, Paciente, Serviço, Data & Hora, Contato, Status, Ações
  - Scroll horizontal em telas pequenas
  - Botões "Confirmar" e "Cancelar" por linha
  - Prévia da mensagem do paciente com ellipsis
- **Filtros por status:** Todos / Pendentes / Confirmados / Cancelados
- **Busca em tempo real** por nome ou e-mail (debounce de 350 ms)
- **Atualização manual** via botão "Atualizar"
- **Contagem de resultados** exibida abaixo da tabela
- **Modo claro/escuro** sincronizado com o resto do sistema

### Login (`login.html`)

- Credenciais pré-preenchidas para demonstração
- Toggle de visibilidade da senha
- Mensagem de erro clara em caso de credenciais inválidas
- Redirecionamento automático se já estiver logado

---

## API — Endpoints

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `POST` | `/api/login` | Autentica e retorna token | Não |
| `GET` | `/api/especialidades` | Lista todos os serviços | Não |
| `POST` | `/api/agendamentos` | Cria nova solicitação | Não |
| `GET` | `/api/agendamentos` | Lista agendamentos (filtros: `status`, `busca`) | Sim |
| `PUT` | `/api/agendamentos/:id/confirmar` | Confirma um agendamento | Sim |
| `DELETE` | `/api/agendamentos/:id` | Cancela um agendamento | Sim |

### Autenticação

Rotas protegidas exigem o header:

```
Authorization: Bearer cb-admin-token-2026
```

Sem o token, a API retorna `401 Unauthorized`.

### Exemplo — criar agendamento

```json
POST /api/agendamentos
Content-Type: application/json

{
  "nome_paciente": "Maria Oliveira",
  "email": "maria@email.com",
  "telefone": "(31) 99999-1111",
  "especialidade_id": 1,
  "data_consulta": "2026-07-10",
  "hora_consulta": "09:00",
  "mensagem": "Curativo pós-cirúrgico na perna direita"
}
```

---

## Banco de Dados

Utiliza **sql.js** — implementação do SQLite em WebAssembly/JavaScript puro, sem dependências de compilador ou binários nativos. O arquivo `db.sqlite` é lido na inicialização e salvo no disco após cada escrita.

### Tabela `especialidades`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | INTEGER PK | Identificador |
| `nome` | TEXT | Nome do serviço |
| `descricao` | TEXT | Descrição detalhada |
| `icone` | TEXT | Classe Font Awesome (ex: `fa-syringe`) |

### Tabela `agendamentos`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | INTEGER PK | Identificador |
| `nome_paciente` | TEXT | Nome completo do paciente |
| `email` | TEXT | E-mail para contato |
| `telefone` | TEXT | Telefone com máscara |
| `especialidade_id` | INTEGER FK | Referência ao serviço |
| `data_consulta` | TEXT | Data no formato `YYYY-MM-DD` |
| `hora_consulta` | TEXT | Horário no formato `HH:MM` |
| `mensagem` | TEXT | Observações opcionais |
| `status` | TEXT | `pendente` \| `confirmado` \| `cancelado` |
| `created_at` | DATETIME | Criação automática |

### Serviços pré-cadastrados (seed)

| # | Serviço | Ícone |
|---|---|---|
| 1 | Curativos e Procedimentos | `fa-bandage` |
| 2 | Administração de Medicação | `fa-syringe` |
| 3 | Home Care | `fa-house-chimney-medical` |
| 4 | Monitoramento de Saúde | `fa-heart-pulse` |
| 5 | Vacinação | `fa-shield-virus` |
| 6 | Orientação em Saúde | `fa-book-medical` |

---

## Design & Responsividade

O CSS usa **variáveis customizadas** para o sistema de temas (`data-theme="light"` / `data-theme="dark"`).

### Breakpoints

| Breakpoint | Comportamento |
|---|---|
| `≤ 1024px` | Footer e specs em 2 colunas; badges ajustados |
| `≤ 768px` | Nav oculta → hambúrguer; hero empilhado (visual primeiro); badges reposicionados nos cantos com animação desativada |
| `≤ 480px` | Tudo em 1 coluna; CTA empilhado; badges ocultos; padding reduzido |

### Badges flutuantes

Os dois badges do hero (`Atendimento domiciliar` e `COREN regularizado`) usam `position: absolute` com `z-index: 2` para ficarem acima do card. Em mobile são reposicionados nas bordas do `hero-visual` (que tem `padding: 44px 0` para criar espaço), e ocultos em telas menores que 480px.

---

## Simulação de E-mail

O sistema não envia e-mails reais. Em vez disso, imprime no console do servidor uma simulação a cada evento:

```
📧 [EMAIL SIMULADO] Agendamento #3 recebido de João Silva (joao@email.com)
   Serviço: Monitoramento de Saúde | Data: 22/06/2026 às 10:30

✅ [EMAIL SIMULADO] Agendamento #3 confirmado!
   Paciente: João Silva | joao@email.com

🚫 [EMAIL SIMULADO] Agendamento #3 cancelado.
```

Para integrar um serviço real (ex: Nodemailer, SendGrid), basta substituir os `console.log` em `routes/agendamentos.js`.

---

## Dependências

```json
{
  "express": "^4.x",
  "cors": "^2.x",
  "sql.js": "^1.x"
}
```

Nenhuma dependência de build, nenhum TypeScript, nenhum bundler. O projeto roda com `node server.js` direto.
