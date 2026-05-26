# 🩺 Mais Médicos — Sistema Web Completo

Sistema web completo para consultório médico com **Node.js + Express + SQLite (sql.js)** no backend e **HTML/CSS/JS puro** no frontend.

---

## 📁 Estrutura

```
projeto-mais-medicos/
├── backend/
│   ├── server.js          # Servidor Express principal
│   ├── database.js        # Inicialização do SQLite (sql.js)
│   ├── routes/
│   │   ├── auth.js        # POST /api/login
│   │   ├── especialidades.js  # GET /api/especialidades
│   │   └── agendamentos.js    # CRUD /api/agendamentos
│   ├── db.sqlite          # Criado automaticamente na 1ª execução
│   └── package.json
├── frontend/
│   ├── index.html         # Página pública (landing page)
│   ├── admin.html         # Painel administrativo
│   ├── login.html         # Login do admin
│   ├── style.css          # Estilos compartilhados
│   ├── script.js          # JS da página pública
│   └── admin.js           # JS do painel admin
└── README.md
```

---

## ▶️ Como executar

### 1. Instalar dependências

```bash
cd backend
npm install
```

### 2. Iniciar o servidor

```bash
node server.js
```

O servidor sobe em **http://localhost:3000**

### 3. Acessar o sistema

| Página | URL |
|--------|-----|
| Site público | http://localhost:3000 |
| Login admin | http://localhost:3000/login.html |
| Painel admin | http://localhost:3000/admin.html |

---

## 🔐 Credenciais de Admin

| Campo | Valor |
|-------|-------|
| E-mail | `admin@maismedicos.com` |
| Senha | `medicina2025` |

---

## 🌐 Endpoints da API

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/api/login` | Autentica admin | ❌ |
| `GET` | `/api/especialidades` | Lista especialidades | ❌ |
| `POST` | `/api/agendamentos` | Cria agendamento | ❌ |
| `GET` | `/api/agendamentos` | Lista agendamentos | ✅ Admin |
| `PUT` | `/api/agendamentos/:id/confirmar` | Confirma consulta | ✅ Admin |
| `DELETE` | `/api/agendamentos/:id` | Cancela consulta | ✅ Admin |

### Autenticação

Rotas protegidas exigem o header:
```
Authorization: Bearer mm-admin-token-2025-secure
```

---

## 🗄️ Banco de dados

Usa **sql.js** (SQLite em JavaScript puro — sem binários nativos).

O arquivo `db.sqlite` é criado automaticamente com dados de exemplo na primeira execução.

### Tabelas

**especialidades**
- `id`, `nome`, `descricao`, `icone` (classe Font Awesome)

**agendamentos**
- `id`, `nome_paciente`, `email`, `telefone`, `especialidade_id`
- `data_consulta`, `hora_consulta`, `mensagem`
- `status` (`pendente` | `confirmado` | `cancelado`)
- `created_at`

---

## ✨ Funcionalidades

### Página pública
- Design responsivo com modo claro/escuro
- Especialidades carregadas via API (`/api/especialidades`)
- Formulário de agendamento com validação completa
- Verificação de conflito de horário no backend
- Máscara de telefone automática

### Painel Admin
- Autenticação com token (localStorage)
- Cards de estatísticas em tempo real
- Gráfico de barras por especialidade
- Filtros por status (pendente/confirmado/cancelado)
- Busca por nome ou e-mail
- Confirmar ou cancelar agendamentos
- Simulação de e-mail no console ao confirmar/cancelar

---

## 🔧 Requisitos

- **Node.js** v18+ 
- Sem dependências de build nativas (sql.js é JavaScript puro)

---

## 📧 Simulação de e-mail

Ao criar, confirmar ou cancelar um agendamento, o sistema imprime no console:

```
📧 [EMAIL SIMULADO] Agendamento #3 recebido de João Silva (joao@email.com) para 2025-06-15 às 14:00
✅ [EMAIL SIMULADO] Agendamento #3 confirmado! Paciente: João Silva...
🚫 [EMAIL SIMULADO] Agendamento #3 cancelado.
```
