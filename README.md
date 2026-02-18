# Chat Platform

Plataforma SaaS de atendimento conversacional — estilo Intercom/Chatwoot.

## Stack
- **Backend:** NestJS + TypeORM + PostgreSQL + Redis + WebSockets (Socket.IO)
- **Frontend:** Next.js 15 (App Router) + Tailwind + Zustand
- **Widget:** Vanilla TypeScript (IIFE bundle via esbuild) + Shadow DOM

## Estrutura

```
chat-platform/
├── apps/
│   ├── backend/     → API NestJS (porta 3001)
│   └── frontend/    → Dashboard Next.js (porta 3000)
└── packages/
    └── widget/      → Script embeddable (dist/widget.js)
```

## Como rodar

### 1. Pré-requisitos
- Node.js 18+
- Docker (para PostgreSQL e Redis)
- pnpm (`npm install -g pnpm`)

### 2. Subir banco de dados e cache
```bash
docker-compose up -d
```

### 3. Backend
```bash
cd apps/backend
cp .env.example .env
# Edite .env com suas chaves JWT
pnpm install
pnpm run start:dev
# API disponível em http://localhost:3001/api
```

### 4. Frontend
```bash
cd apps/frontend
npm install
npm run dev
# Dashboard disponível em http://localhost:3000
```

### 5. Widget (desenvolvimento)
```bash
cd packages/widget
npm install
npm run build
# Para testar: abrir demo.html no browser
```

## Primeiro acesso

1. Acesse http://localhost:3000
2. Crie sua conta → informe nome, email, senha e nome da empresa
3. Você será redirecionado para a Inbox

## Instalar widget em um site

1. No dashboard, vá em **Settings → Widget**
2. Copie o código de instalação
3. Cole antes do `</body>` do seu site

O widget irá:
- Mostrar um balão flutuante
- Solicitar nome + email do visitante na 1ª abertura
- Persistir a conversa via cookie (mesmo após fechar o browser)
- Notificar o visitante por email se o agente responder após ele sair

## Rotas da API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/auth/register | Criar conta + empresa |
| POST | /api/auth/login | Login |
| POST | /api/auth/refresh | Renovar token |
| GET | /api/conversations | Listar conversas |
| POST | /api/conversations/:id/assign | Atribuir agente |
| PATCH | /api/conversations/:id/status | Resolver/reabrir |
| GET | /api/conversations/:id/messages | Mensagens |
| POST | /api/conversations/:id/messages | Enviar mensagem |
| POST | /api/widget/session | Init widget session |
| POST | /api/widget/identify | Identificar visitante |
| GET | /api/dashboard/metrics | Métricas |

## WebSocket Events (namespace /agent)

| Evento | Direção | Descrição |
|--------|---------|-----------|
| `message:new` | Server→Client | Nova mensagem |
| `conversation:updated` | Server→Client | Conversa atualizada |
| `contact:typing` | Server→Client | Visitante digitando |
| `agent:typing` | Server→Client | Agente digitando |
| `message:status` | Server→Client | Status de entrega/leitura |
| `typing:start` | Client→Server | Agente começou a digitar |
| `typing:stop` | Client→Server | Agente parou de digitar |
| `presence:ping` | Client→Server | Keep-alive online (30s) |
| `conversation:join` | Client→Server | Entrar na sala da conversa |
