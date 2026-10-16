---
title: Customer Intelligence RAG API
emoji: 🔎
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 3001
pinned: false
---

# Customer Intelligence RAG — API

NestJS backend for [customer-intelligence-rag](https://github.com/fatmakyldz/customer-intelligence-rag).
The front matter above lets this folder run as a Docker Space on Hugging Face; see `DEPLOY.md` in the repository root.

Endpoints (prefix `/api`): `GET /` health · `POST /query` · `POST /ingest` (needs `x-admin-token` when `ADMIN_TOKEN` is set) · `GET /conversations`.
