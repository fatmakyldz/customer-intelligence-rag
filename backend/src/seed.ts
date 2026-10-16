import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/hf_transformers';
import * as dotenv from 'dotenv';
import { seedDocuments } from './database/seed-data';
import { ensureSchema, sslOptionFor } from './database/schema';
import { EMBEDDING_MODEL } from './embeddings/embeddings.service';

dotenv.config();

// Manual seed: `npm run seed`. Adds the demo documents again even if some exist.
// The server also seeds automatically on boot when the table is empty.
async function seed() {
  const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ragdb';
  const dataSource = new DataSource({ type: 'postgres', url, ssl: sslOptionFor(url) });

  await dataSource.initialize();
  await ensureSchema(dataSource);
  console.log('Database connected');

  const embeddings = new HuggingFaceTransformersEmbeddings({ modelName: EMBEDDING_MODEL });

  console.log(`Seeding ${seedDocuments.length} documents...`);

  for (let i = 0; i < seedDocuments.length; i++) {
    const doc = seedDocuments[i];
    console.log(`[${i + 1}/${seedDocuments.length}] Embedding: ${doc.metadata.type} - ${doc.source}`);

    const vector = await embeddings.embedQuery(doc.content);
    await dataSource.query(
      `INSERT INTO documents (content, metadata, embedding, source)
       VALUES ($1, $2, $3::vector, $4)`,
      [doc.content, JSON.stringify(doc.metadata), `[${vector.join(',')}]`, doc.source],
    );
  }

  console.log('Seed complete!');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
