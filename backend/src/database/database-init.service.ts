import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { ensureSchema } from './schema';
import { seedDocuments } from './seed-data';

/**
 * On boot: create the pgvector schema if missing and, when the knowledge base
 * is empty, load the demo documents so a fresh deployment is usable at once.
 * Set SEED_ON_EMPTY=false to skip the demo data.
 */
@Injectable()
export class DatabaseInitService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseInitService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly embeddings: EmbeddingsService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await ensureSchema(this.dataSource);
    this.logger.log('Database schema ready');

    // Seeding/warm-up downloads the embedding model, so run it in the background:
    // the server starts listening right away, and a failure is logged (and retried
    // on the next boot) instead of crashing the container.
    this.seedIfEmpty().catch((err) =>
      this.logger.error(`Seeding/warm-up failed: ${(err as Error).message}`),
    );
  }

  private async seedIfEmpty(): Promise<void> {
    if (process.env.SEED_ON_EMPTY === 'false') {
      await this.embeddings.warmUp();
      return;
    }

    const [{ count }] = await this.dataSource.query(`SELECT COUNT(*)::int AS count FROM documents`);
    if (count > 0) {
      this.logger.log(`Knowledge base has ${count} documents`);
      await this.embeddings.warmUp();
      return;
    }

    this.logger.log(`Knowledge base empty — seeding ${seedDocuments.length} demo documents`);
    for (const doc of seedDocuments) {
      const vector = await this.embeddings.embedAsVectorLiteral(doc.content);
      await this.dataSource.query(
        `INSERT INTO documents (content, metadata, embedding, source)
         VALUES ($1, $2, $3::vector, $4)`,
        [doc.content, JSON.stringify(doc.metadata), vector, doc.source],
      );
    }
    this.logger.log('Demo documents seeded');
  }
}
