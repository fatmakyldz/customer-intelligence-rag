import { Injectable, Logger } from '@nestjs/common';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/hf_transformers';

export const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';

/**
 * Single shared embedding model for the whole app.
 * Loading MiniLM once (instead of once per service) keeps memory low,
 * which matters on free hosting tiers.
 */
@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private readonly model = new HuggingFaceTransformersEmbeddings({
    modelName: EMBEDDING_MODEL,
  });

  async embed(text: string): Promise<number[]> {
    return this.model.embedQuery(text);
  }

  async embedAsVectorLiteral(text: string): Promise<string> {
    const vector = await this.embed(text);
    return `[${vector.join(',')}]`;
  }

  async warmUp(): Promise<void> {
    const started = Date.now();
    await this.embed('warm up');
    this.logger.log(`Embedding model ready in ${Date.now() - started} ms`);
  }
}
