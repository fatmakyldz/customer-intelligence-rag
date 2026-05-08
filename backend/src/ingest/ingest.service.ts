import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/hf_transformers';
import { IngestDto } from './dto/ingest.dto';

@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);
  private readonly embeddings: HuggingFaceTransformersEmbeddings;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    this.embeddings = new HuggingFaceTransformersEmbeddings({
      modelName: 'Xenova/all-MiniLM-L6-v2',
    });
  }

  async ingest(dto: IngestDto): Promise<{ id: string; message: string }> {
    this.logger.log(`Ingesting document from source: ${dto.source}`);

    const vector = await this.embeddings.embedQuery(dto.content);
    const vectorStr = `[${vector.join(',')}]`;

    const metadata = {
      ...dto.metadata,
      type: dto.type,
    };

    const result = await this.dataSource.query(
      `INSERT INTO documents (content, metadata, embedding, source)
       VALUES ($1, $2, $3::vector, $4)
       RETURNING id`,
      [dto.content, JSON.stringify(metadata), vectorStr, dto.source],
    );

    const id = result[0].id;
    this.logger.log(`Document ingested with id: ${id}`);

    return { id, message: 'Document ingested successfully' };
  }
}
