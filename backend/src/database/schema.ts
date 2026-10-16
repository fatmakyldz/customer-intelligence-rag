import { DataSource } from 'typeorm';

/**
 * Same schema as init.sql, applied from code so managed databases
 * (Neon, Supabase) work without a docker-entrypoint init script.
 * Every statement is idempotent.
 */
export const SCHEMA_STATEMENTS = [
  `CREATE EXTENSION IF NOT EXISTS vector`,
  `CREATE TABLE IF NOT EXISTS documents (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     content TEXT NOT NULL,
     metadata JSONB DEFAULT '{}',
     embedding vector(384),
     source VARCHAR(255) NOT NULL DEFAULT 'unknown',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS documents_embedding_idx
     ON documents USING ivfflat (embedding vector_cosine_ops)
     WITH (lists = 10)`,
];

export async function ensureSchema(dataSource: DataSource): Promise<void> {
  for (const statement of SCHEMA_STATEMENTS) {
    await dataSource.query(statement);
  }
}

/**
 * Managed Postgres providers require TLS. Enable it when the URL asks for it
 * (sslmode=require) or when DATABASE_SSL=true; keep it off for local docker.
 */
export function sslOptionFor(url: string | undefined): false | { rejectUnauthorized: boolean } {
  const wantsSsl =
    process.env.DATABASE_SSL === 'true' || /sslmode=(require|verify-ca|verify-full)/.test(url ?? '');
  return wantsSsl ? { rejectUnauthorized: false } : false;
}
