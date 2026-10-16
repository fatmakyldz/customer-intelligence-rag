# Deploying for free

Three free services, ~20 minutes, no credit card:

| Part | Service | Free tier notes |
|---|---|---|
| Database | **Neon** (Postgres 16 + pgvector) | 0.5 GB; compute suspends when idle and wakes on the next query |
| Backend (NestJS) | **Hugging Face Docker Space** | CPU Basic (2 vCPU, 16 GB RAM); sleeps after ~48 h without traffic, wakes on the next visit |
| Frontend (Next.js) | **Vercel** | Hobby plan |
| LLM | **Groq** | Free API key; daily token caps per model |

```
Browser ──► Vercel (frontend) ──► HF Space (backend :3001) ──► Neon (pgvector)
                                          └──────────────────► Groq API
```

---

## 1 — Groq API key

1. Sign in at <https://console.groq.com> → **API Keys** → **Create API Key**.
2. Keep the `gsk_…` value for step 3.

Default model: `openai/gpt-oss-120b`. If you hit the daily cap, set `GROQ_MODEL=llama-3.1-8b-instant` (largest free daily allowance) or `llama-3.3-70b-versatile`.

## 2 — Neon database

1. Sign up at <https://neon.tech> → **New project** (region: Frankfurt / `eu-central-1` is closest to Istanbul).
2. **Connect** → copy the connection string. It looks like
   `postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`
3. Nothing else to do: the backend runs `CREATE EXTENSION vector`, creates the tables and loads the 10 demo documents on first start.

## 3 — Backend on a Hugging Face Space

1. <https://huggingface.co/new-space> → name `customer-intelligence-rag-api`, SDK **Docker**, template **Blank**, hardware **CPU basic (free)**, visibility **Public**.
2. Space → **Settings → Variables and secrets** → add as **Secrets**:

   | Name | Value |
   |---|---|
   | `GROQ_API_KEY` | from step 1 |
   | `DATABASE_URL` | from step 2 |
   | `ADMIN_TOKEN` | any long random string (protects *Add Document*) |
   | `CORS_ORIGINS` | your Vercel URL from step 4, e.g. `https://customer-intelligence-rag.vercel.app` (comma-separate several; add a custom domain here too) |

   Optional: `GROQ_MODEL`, `QUERY_RATE_LIMIT_PER_MIN` (default 5).
3. Push the backend into the Space — pick one:
   - **Automatic (recommended):** GitHub repo → **Settings → Secrets and variables → Actions** → secret `HF_TOKEN` (an HF token with *write* access, from <https://huggingface.co/settings/tokens>) and variable `HF_SPACE` = `fatmakyldz/customer-intelligence-rag-api`. Then **Actions → Deploy backend to Hugging Face Space → Run workflow**. After that, every push to `main` that touches `backend/` redeploys.
   - **Manual:** `pip install huggingface_hub` then
     `hf upload fatmakyldz/customer-intelligence-rag-api backend . --repo-type=space`
4. The Space builds the Docker image (first build ~5 min, it also downloads the embedding model). When it shows **Running**, open
   `https://fatmakyldz-customer-intelligence-rag-api.hf.space/api` → you should see `{"status":"ok",…}`.

## 4 — Frontend on Vercel

1. <https://vercel.com/new> → import `fatmakyldz/customer-intelligence-rag`.
2. **Root Directory:** `frontend` (framework is detected as Next.js).
3. **Environment Variables:** `NEXT_PUBLIC_API_URL` = `https://fatmakyldz-customer-intelligence-rag-api.hf.space` (no trailing `/api`).
4. Deploy. Copy the resulting URL into the Space's `CORS_ORIGINS` secret (step 3.2) — the Space restarts by itself.

### Custom domain (optional)

Vercel project → **Settings → Domains** → add e.g. `rag.fomertech.com`, create the CNAME record it shows at your DNS provider, then add `https://rag.fomertech.com` to `CORS_ORIGINS`.

---

## What protects the public demo

- `POST /api/ingest` requires the `x-admin-token` header when `ADMIN_TOKEN` is set (the *Add Document* page has a field for it).
- Rate limits per visitor IP: 5 questions/min (configurable), 20 ingests/min, 60 requests/min overall.
- Input caps: questions ≤ 500 characters, documents ≤ 10 000 characters.
- CORS only allows the origins in `CORS_ORIGINS`.

Note: `GET /api/conversations` is public, so every visitor sees the shared question history — fine for a demo, don't paste private data into it.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Frontend shows "Failed to fetch" | `CORS_ORIGINS` doesn't include the exact frontend origin (scheme + host, no trailing slash), or the Space is still waking up — reload after ~30 s. |
| `429` / "Too many requests" | Per-visitor rate limit; wait a minute. A `429` from Groq means the daily token cap — switch `GROQ_MODEL`. |
| Answers but no sources | Knowledge base empty: check the Space logs for `Demo documents seeded`. |
| Space build fails at `npm ci` | `backend/package-lock.json` is out of date — run `npm install` in `backend/` and commit the lock file. |
