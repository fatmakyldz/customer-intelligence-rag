# Customer Intelligence RAG System

> Turn raw customer feedback, sales calls, and documentation into actionable business intelligence — powered by a local embedding model and an LLM agent with semantic search.

[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![LangChain](https://img.shields.io/badge/LangChain-0.3-1C3C3C?logo=langchain&logoColor=white)](https://js.langchain.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![pgvector](https://img.shields.io/badge/pgvector-0.7-4169E1?logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          User Browser                               │
│                       Next.js  :3002                                │
│  ┌──────────────┐   ┌──────────────────────────────────────────┐   │
│  │   Sidebar    │   │           Intelligence Dashboard          │   │
│  │  (History)   │   │  Query Input → ResponseDisplay            │   │
│  │              │   │  ReasoningPath → SourceBadge              │   │
│  └──────────────┘   └──────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ REST /api/*
┌──────────────────────────────▼──────────────────────────────────────┐
│                       NestJS Backend  :3001                         │
│                                                                     │
│  POST /api/ingest          POST /api/query        GET /api/convos   │
│        │                         │                      │           │
│  ┌─────▼─────┐           ┌───────▼──────┐               │           │
│  │  Ingest   │           │  LangChain   │               │           │
│  │  Service  │           │  Tool Agent  │               │           │
│  └─────┬─────┘           └───────┬──────┘               │           │
│        │                   ┌─────┴──────────────┐        │           │
│        │             ┌─────▼──────┐  ┌──────────▼──┐    │           │
│        │             │  vector_   │  │ categorize_ │    │           │
│        │             │  search    │  │ insight     │    │           │
│        │             └─────┬──────┘  └─────────────┘    │           │
│        │                   │                             │           │
│  ┌─────▼───────────────────▼─────────────────────────────▼──────┐   │
│  │    HuggingFace Transformers  ·  all-MiniLM-L6-v2 (local)     │   │
│  │                   384-dimensional embeddings                  │   │
│  └─────────────────────────┬─────────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                    PostgreSQL 16 + pgvector  :5432                  │
│                                                                     │
│   documents                          conversations                  │
│   ┌──────────────────────────┐       ┌────────────────────────┐     │
│   │ id          UUID         │       │ id           UUID      │     │
│   │ content     TEXT         │       │ question     TEXT      │     │
│   │ metadata    JSONB        │       │ answer       TEXT      │     │
│   │ embedding   vector(384)  │       │ sources      JSONB     │     │
│   │ source      VARCHAR      │       │ reasoning_steps JSONB  │     │
│   │ created_at  TIMESTAMPTZ  │       │ category     VARCHAR   │     │
│   └──────────────────────────┘       └────────────────────────┘     │
│   INDEX: ivfflat (cosine_ops, lists=10)                              │
└─────────────────────────────────────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Groq Cloud    │
                    │ llama-3.1-8b-   │
                    │    instant      │
                    └─────────────────┘
```

---

## Features

- **Semantic Search** — Documents are embedded with `all-MiniLM-L6-v2` (384-dim, runs fully local) and stored in PostgreSQL with a pgvector `ivfflat` cosine index for fast nearest-neighbour retrieval.
- **Tool-Calling Agent** — A LangChain `createToolCallingAgent` loop drives reasoning: the agent iterates up to 6 times, deciding when to call `vector_search` and when to call `categorize_insight`.
- **Insight Classification** — Every answer is labelled `opportunity`, `risk`, or `neutral` based on the agent's own reasoning, surfaced as a colour-coded badge in the UI.
- **Conversation History** — All Q&A sessions are persisted to PostgreSQL and surfaced in a collapsible sidebar for instant replay without re-running the query.
- **Document Ingestion UI** — A `/ingest` page lets you add feedback, sales call notes, or documentation through a form without touching the API directly.
- **Reasoning Transparency** — The UI renders each intermediate agent step (tool name, input, output excerpt) so you can follow the full chain of thought.
- **Source Attribution** — Every answer shows which documents were retrieved, their source label, and cosine similarity score.
- **Zero-config local stack** — One `docker-compose up` starts Postgres (with pgvector auto-enabled via `init.sql`), the NestJS API, and the Next.js frontend.

---

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) 24+
- A free [Groq API key](https://console.groq.com)

### 1 — Clone and configure

```bash
git clone https://github.com/fatmaakyildiz/customer-intelligence-rag.git
cd customer-intelligence-rag
cp .env.example .env
```

Open `.env` and add your key:

```dotenv
GROQ_API_KEY=gsk_your_key_here
```

### 2 — Start the stack

```bash
docker-compose up --build
```

| Service     | URL                       |
|-------------|---------------------------|
| Frontend    | http://localhost:3002      |
| Backend API | http://localhost:3001/api  |
| PostgreSQL  | localhost:5432 (`ragdb`)   |

Wait ~60 seconds on first build while `all-MiniLM-L6-v2` downloads inside the backend container.

### 3 — Seed the knowledge base

Load 10 realistic sample documents (customer feedback, sales calls, compliance docs) and generate their embeddings:

```bash
# Inside the running container
docker exec rag_backend npm run seed
```

Or locally if you have Node 20+ and a `DATABASE_URL` in `.env`:

```bash
cd backend
npm install
npm run seed
```

### 4 — Open the dashboard

Navigate to **http://localhost:3002** and ask your first question.

---

## Example Queries

Try these in the dashboard or send them directly to the API:

| Query | Expected category |
|---|---|
| `What are customers saying about our API rate limits?` | **risk** |
| `What are the biggest sales opportunities this quarter?` | **opportunity** |
| `Are there any churn risks I should know about?` | **risk** |
| `Which deals are blocked and why?` | **risk** |
| `What compliance requirements do enterprise customers need?` | **neutral** |
| `Summarise all negative customer feedback and suggest fixes.` | **risk** |

---

## API Reference

Base URL: `http://localhost:3001/api`

---

### `GET /`

Health check.

**Response**
```json
{ "status": "ok", "message": "Customer Intelligence RAG API is running" }
```

---

### `POST /ingest`

Embed and store a document in the knowledge base.

**Request body**
```json
{
  "content": "Customer Sarah at TechCorp loves the new dashboard — reporting time dropped from 4 hours to 30 minutes.",
  "source": "customer_feedback",
  "type": "feedback",
  "metadata": {
    "customer": "Sarah",
    "company": "TechCorp",
    "sentiment": "positive",
    "date": "2024-01-15"
  }
}
```

| Field      | Type                                                    | Required |
|------------|---------------------------------------------------------|----------|
| `content`  | `string` (min 10 chars)                                 | ✅       |
| `source`   | `string`                                                | ✅       |
| `type`     | `"feedback" \| "sales_call" \| "documentation"`         | ✅       |
| `metadata` | `object`                                                | No       |

**Response `201`**
```json
{ "id": "e3b0c442-98fb-4b2c-9d2f-1a3456789abc", "message": "Document ingested successfully" }
```

---

### `POST /query`

Run an agentic RAG query against the knowledge base.

**Request body**
```json
{ "question": "What are the biggest churn risks right now?" }
```

| Field      | Type                   | Required |
|------------|------------------------|----------|
| `question` | `string` (min 3 chars) | ✅       |

**Response `200`**
```json
{
  "answer": "The highest churn risk is DataInc, where 30% of the 200-person team experiences SSO session drops every few hours...",
  "category": "risk",
  "reasoning_steps": [
    {
      "step": 1,
      "action": "vector_search",
      "input": "{\"query\": \"churn risk customer issues\"}",
      "output": "[1] Source: customer_feedback (similarity: 0.891)\nCritical feedback from CTO at DataInc..."
    },
    {
      "step": 2,
      "action": "categorize_insight",
      "input": "{\"category\": \"risk\", \"insight\": \"DataInc is at high churn risk\", \"reasoning\": \"Active competitor evaluation + unresolved SSO tickets\"}",
      "output": "{\"category\": \"risk\", \"insight\": \"...\", \"reasoning\": \"...\"}"
    }
  ],
  "sources": [
    {
      "content": "Critical feedback from CTO at DataInc: intermittent authentication failures...",
      "source": "customer_feedback",
      "similarity": 0.891,
      "metadata": { "company": "DataInc", "churn_risk": "high" }
    }
  ]
}
```

| Field             | Description                                               |
|-------------------|-----------------------------------------------------------|
| `answer`          | Final synthesised answer from the LLM                    |
| `category`        | `"opportunity"`, `"risk"`, or `"neutral"`                |
| `reasoning_steps` | Ordered list of every tool call the agent made           |
| `sources`         | Retrieved documents with cosine similarity scores         |

---

### `GET /conversations`

Return the 20 most recent Q&A sessions, ordered newest first.

**Response `200`**
```json
[
  {
    "id": "uuid",
    "question": "What are the churn risks?",
    "answer": "...",
    "sources": [...],
    "reasoning_steps": [...],
    "category": "risk",
    "created_at": "2024-02-10T14:32:00Z"
  }
]
```

---

## Screenshots

> _Run `docker-compose up && docker exec rag_backend npm run seed`, open http://localhost:3002, and replace these placeholders._

**Intelligence Dashboard**

```
[ screenshot: docs/screenshots/dashboard.png ]
```

**Reasoning Steps Panel**

```
[ screenshot: docs/screenshots/reasoning-steps.png ]
```

**Document Ingest Form**

```
[ screenshot: docs/screenshots/ingest-form.png ]
```

---

## Project Structure

```
customer-intelligence-rag/
├── backend/
│   └── src/
│       ├── ingest/           # Document embedding + pgvector storage
│       │   ├── ingest.controller.ts
│       │   ├── ingest.service.ts
│       │   └── dto/ingest.dto.ts
│       ├── query/            # LangChain tool-calling agent
│       │   ├── query.controller.ts
│       │   ├── query.service.ts   ← agent + tools live here
│       │   └── dto/query.dto.ts
│       ├── conversations/    # Q&A history CRUD
│       ├── entities/         # TypeORM entity definitions
│       ├── database/
│       │   └── init.sql      # pgvector extension + schema + index
│       └── seed.ts           # 10 sample documents with embeddings
├── frontend/
│   ├── app/
│   │   ├── page.tsx          # Main dashboard
│   │   └── ingest/           # Document ingestion UI
│   └── components/
│       ├── ResponseDisplay.tsx
│       ├── ReasoningPath.tsx  # Expandable step-by-step timeline
│       ├── SourceBadge.tsx
│       └── ConversationList.tsx
├── docker-compose.yml
└── .env.example
```

---

## Tech Stack

| Layer             | Technology                                                     |
|-------------------|----------------------------------------------------------------|
| Frontend          | Next.js 15, TypeScript, Tailwind CSS                           |
| Backend           | NestJS 10, TypeScript, TypeORM 0.3                             |
| AI / Agent        | LangChain 0.3, Groq (`llama-3.1-8b-instant`)                  |
| Embeddings        | HuggingFace `all-MiniLM-L6-v2` via `@xenova/transformers` — runs locally, no API key required |
| Vector store      | PostgreSQL 16 + pgvector (`ivfflat` index, cosine similarity)  |
| Containerisation  | Docker Compose                                                 |

---

## Local Development (without Docker)

**Database only**
```bash
docker run -d \
  -e POSTGRES_DB=ragdb \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -v "$(pwd)/backend/src/database/init.sql:/docker-entrypoint-initdb.d/00_init.sql" \
  pgvector/pgvector:pg16
```

**Backend**
```bash
cd backend
npm install
npm run start:dev   # hot-reload on :3001
```

**Frontend**
```bash
cd frontend
npm install
npm run dev         # :3000 in dev mode
```

---

## License

MIT
