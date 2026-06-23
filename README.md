# MOD-DC Local Intelligence Platform

> An **offline / local** AI risk analyst for **modular edge data centers**. It analyzes server room documents, sensor logs, UPS events, fire alarm records, maintenance reports, and facility/company documents to detect risk of **data loss, overheating, UPS failure, fire-system failure, and operational downtime** — then cites its sources and recommends practical actions. Powered by a local embedding model and a **local LLM via Ollama** (no cloud, air-gap friendly).

[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![LangChain](https://img.shields.io/badge/LangChain-0.3-1C3C3C?logo=langchain&logoColor=white)](https://js.langchain.com)
[![Ollama](https://img.shields.io/badge/Ollama-local%20LLM-000000?logo=ollama&logoColor=white)](https://ollama.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![pgvector](https://img.shields.io/badge/pgvector-0.7-4169E1?logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)

---

## Why local / offline?

Modular edge data centers often run in restricted, air-gapped, or low-connectivity environments where facility telemetry must **never leave the site**. MOD-DC keeps the entire pipeline local:

- **Embeddings** run locally (`all-MiniLM-L6-v2`, no API key).
- **The LLM runs locally via [Ollama](https://ollama.com)** — default model `qwen2.5`, no cloud calls.
- **The vector store (PostgreSQL + pgvector)** runs on-site.

This makes it suitable as a demo for **patent, investor, and customer meetings**, and as a foundation for autonomous local data-center risk analysis.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          User Browser                               │
│                       Next.js  :3002                                │
│  ┌──────────────┐   ┌──────────────────────────────────────────┐   │
│  │   Sidebar    │   │        Facility Intelligence Dashboard    │   │
│  │  (History)   │   │  Query Input → ResponseDisplay            │   │
│  │              │   │  Analysis Steps → SourceBadge            │   │
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
│        │             │  vector_   │  │  classify_  │    │           │
│        │             │  search    │  │  risk       │    │           │
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
                    ┌────────▼─────────┐
                    │   Ollama (local) │
                    │  qwen2.5         │
                    │  :11434 /api/chat│
                    └──────────────────┘
```

---

## Features

- **Semantic Search** — Facility records are embedded with `all-MiniLM-L6-v2` (384-dim, fully local) and stored in PostgreSQL with a pgvector `ivfflat` cosine index for fast nearest-neighbour retrieval.
- **Local Tool-Calling Agent** — A LangChain `createToolCallingAgent` loop runs against a **local Ollama model**. The agent decides when to call `vector_search` and when to call `classify_risk`.
- **Risk Classification** — Every answer is labelled **`critical`**, **`warning`**, **`normal`**, or **`insight`**, surfaced as a colour-coded badge in the UI.
- **Data-Center Risk Analysis** — The assistant explicitly assesses risk of data loss / disk failure, overheating (temperature & humidity), UPS failure (battery runtime/degradation), fire-system failure (panel faults), and downtime.
- **Source Attribution** — Every answer shows which records were retrieved, their source label, and cosine similarity score.
- **Analysis Steps (Retrieved Evidence)** — The UI renders each **auditable tool call** (semantic searches + risk classification) — *not* the model's hidden chain-of-thought — so an operator can trace exactly which evidence drove the answer.
- **Conversation History** — All Q&A sessions are persisted to PostgreSQL and surfaced in a collapsible sidebar for instant replay.
- **Record Ingestion UI** — A `/ingest` page lets you add sensor logs, UPS events, fire alarm events, maintenance reports, and facility/company documents through a form.

---

## Document Types

| Type | Description |
|------|-------------|
| `sensor_log` | Temperature & humidity readings from server room sensors |
| `ups_event` | UPS self-tests, battery runtime & degradation events |
| `fire_alarm_event` | Fire panel alarms, faults, and scheduled tests |
| `maintenance_report` | CRAC/cooling maintenance, incidents, work orders |
| `facility_document` | Operating thresholds, SOPs, runbooks, layouts |
| `company_document` | Policies, SLAs, business continuity documents |

## Risk Categories

| Category | Meaning |
|----------|---------|
| 🔴 `critical` | Imminent threat of data loss, overheating, UPS/fire-system failure, or downtime |
| 🟠 `warning` | Degrading condition trending toward a threshold |
| 🟢 `normal` | Readings within safe operating limits |
| 💡 `insight` | A notable observation / optimization opportunity, not an active risk |

---

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) 24+
- [Ollama](https://ollama.com/download) installed and running on the host machine

### 1 — Install Ollama and pull a model

The default model is **`qwen2.5`** (strong tool-calling, multilingual). Pull it:

```bash
ollama pull qwen2.5
```

**Fallback models** (if `qwen2.5` is unavailable or too heavy for your hardware):

```bash
ollama pull llama3.1     # recommended first fallback — reliable tool-calling
ollama pull mistral      # lighter / faster fallback
```

To use a fallback, set `OLLAMA_MODEL` in `.env` (e.g. `OLLAMA_MODEL=llama3.1`).

Verify Ollama is serving:

```bash
ollama list
curl http://localhost:11434/api/tags
```

> The backend talks to Ollama's `http://localhost:11434/api/chat` endpoint (via LangChain). When the backend runs **inside Docker** and Ollama runs on the **host**, it uses `http://host.docker.internal:11434` automatically (configured in `docker-compose.yml`).

### 2 — Clone and configure

```bash
git clone https://github.com/fatmakyldz/customer-intelligence-rag.git
cd customer-intelligence-rag
cp .env.example .env
```

`.env` defaults (no API keys needed — fully local):

```dotenv
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ragdb
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3 — Start the stack

```bash
docker-compose up --build
```

| Service     | URL                       |
|-------------|---------------------------|
| Frontend    | http://localhost:3002      |
| Backend API | http://localhost:3001/api  |
| PostgreSQL  | localhost:5432 (`ragdb`)   |

Wait ~60 seconds on first build while `all-MiniLM-L6-v2` downloads inside the backend container.

### 4 — Seed the demo knowledge base

Load realistic facility demo records (temperature/humidity logs, UPS degradation, fire alarm events, CRAC maintenance, incident reports) and generate their embeddings:

```bash
# Inside the running container
docker exec moddc_backend npm run seed
```

Or locally if you have Node 20+ and a `DATABASE_URL` in `.env`:

```bash
cd backend
npm install
npm run seed
```

### 5 — Open the dashboard

Navigate to **http://localhost:3002** and ask your first question.

---

## Example Queries (demo script)

The seeded data is crafted so these questions produce vivid, citeable answers:

| Query | Expected category |
|---|---|
| `Is there any risk of overheating in the server rooms right now?` | **critical** (MOD-DC-01 at 35.4°C, humidity 69%) |
| `Are any UPS units at risk of failing during a power outage?` | **critical** (UPS-A runtime 17 min < 20 min) |
| `Is there a risk of data loss from disk or storage failures?` | **critical** (SAN-1 two SMART pre-fail disks, backups failing) |
| `Are the fire alarm panels healthy?` | **critical** (FACP-1 zone Z3 fault) |
| `Is cooling maintenance up to date?` | **warning** (CRAC-2 maintenance 38 days overdue) |
| `Which modules are operating normally?` | **normal** (MOD-DC-02 within limits) |

---

## API Reference

Base URL: `http://localhost:3001/api`

### `GET /`

Health check.

```json
{ "status": "ok", "message": "MOD-DC Local Intelligence Platform API is running" }
```

### `POST /ingest`

Embed and store a facility record.

**Request body**
```json
{
  "content": "Temperature sensor log - Module MOD-DC-01, Cold Aisle A. Inlet air now 35.4°C, above the 35°C critical threshold.",
  "source": "temp_sensor_mod01_aisleA",
  "type": "sensor_log",
  "metadata": { "module": "MOD-DC-01", "metric": "temperature_celsius", "latest_value": 35.4 }
}
```

| Field      | Type | Required |
|------------|------|----------|
| `content`  | `string` (min 10 chars) | ✅ |
| `source`   | `string` | ✅ |
| `type`     | `"sensor_log" \| "ups_event" \| "fire_alarm_event" \| "maintenance_report" \| "facility_document" \| "company_document"` | ✅ |
| `metadata` | `object` | No |

**Response `201`**
```json
{ "id": "e3b0c442-98fb-4b2c-9d2f-1a3456789abc", "message": "Document ingested successfully" }
```

### `POST /query`

Run an agentic RAG query against the knowledge base.

**Request body**
```json
{ "question": "Is there any risk of overheating right now?" }
```

**Response `200`**
```json
{
  "answer": "Yes — Module MOD-DC-01 is at critical risk of overheating. The cold-aisle inlet temperature has risen to 35.4°C (source: temp_sensor_mod01_aisleA), above the 35°C critical threshold, and humidity has reached 69% (source: humidity_sensor_mod01). Root cause is CRAC-2 maintenance, 38 days overdue (source: crac2_maintenance). Recommended actions: dispatch emergency CRAC-2 maintenance, increase airflow / redundant cooling, and consider shifting load to MOD-DC-02.",
  "category": "critical",
  "reasoning_steps": [
    {
      "step": 1,
      "action": "vector_search",
      "input": "{\"query\": \"server room temperature overheating risk\"}",
      "output": "[1] Source: temp_sensor_mod01_aisleA (similarity: 0.88)\nTemperature sensor log - Module MOD-DC-01 ... 35.4°C ..."
    },
    {
      "step": 2,
      "action": "classify_risk",
      "input": "{\"category\": \"critical\", \"finding\": \"MOD-DC-01 overheating\", \"reasoning\": \"35.4°C above 35°C threshold + 69% humidity\"}",
      "output": "{\"category\": \"critical\", \"finding\": \"...\", \"reasoning\": \"...\"}"
    }
  ],
  "sources": [
    {
      "content": "Temperature sensor log - Module MOD-DC-01 ...",
      "source": "temp_sensor_mod01_aisleA",
      "similarity": 0.88,
      "metadata": { "module": "MOD-DC-01", "severity": "critical" }
    }
  ]
}
```

| Field             | Description |
|-------------------|-------------|
| `answer`          | Final synthesised answer (cites sources + recommends actions) |
| `category`        | `"critical"`, `"warning"`, `"normal"`, or `"insight"` |
| `reasoning_steps` | Ordered list of every tool call the agent made (auditable evidence trail) |
| `sources`         | Retrieved records with cosine similarity scores |

### `GET /conversations`

Return the 20 most recent Q&A sessions, newest first.

---

## Project Structure

```
mod-dc-local-intelligence/
├── backend/
│   └── src/
│       ├── ingest/           # Record embedding + pgvector storage
│       │   ├── ingest.controller.ts
│       │   ├── ingest.service.ts
│       │   └── dto/ingest.dto.ts   ← 6 document types
│       ├── query/            # LangChain tool-calling agent (Ollama)
│       │   ├── query.controller.ts
│       │   ├── query.service.ts    ← agent + tools + DC-analyst prompt
│       │   └── dto/query.dto.ts
│       ├── conversations/    # Q&A history
│       ├── entities/         # TypeORM entity definitions
│       ├── database/
│       │   └── init.sql      # pgvector extension + schema + index
│       └── seed.ts           # Facility demo records with embeddings
├── frontend/
│   ├── app/
│   │   ├── page.tsx          # Facility Intelligence dashboard
│   │   └── ingest/           # Record ingestion UI
│   └── components/
│       ├── ResponseDisplay.tsx
│       ├── ReasoningPath.tsx   # "Analysis Steps" — auditable evidence trail
│       ├── SourceBadge.tsx
│       └── ConversationList.tsx
├── docker-compose.yml
└── .env.example
```

---

## Tech Stack

| Layer             | Technology |
|-------------------|------------|
| Frontend          | Next.js 14, TypeScript, Tailwind CSS |
| Backend           | NestJS 10, TypeScript, TypeORM 0.3 |
| AI / Agent        | LangChain 0.3, **Ollama local LLM (`qwen2.5`; fallbacks `llama3.1`, `mistral`)** |
| Embeddings        | HuggingFace `all-MiniLM-L6-v2` via `@xenova/transformers` — runs locally, no API key |
| Vector store      | PostgreSQL 16 + pgvector (`ivfflat` index, cosine similarity) |
| Containerisation  | Docker Compose |

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

**Ollama** (on host)
```bash
ollama pull qwen2.5
ollama serve   # usually already running as a service on :11434
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
