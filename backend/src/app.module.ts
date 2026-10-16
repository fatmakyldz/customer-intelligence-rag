import { Module, Controller, Get } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { IngestModule } from './ingest/ingest.module';
import { QueryModule } from './query/query.module';
import { ConversationsModule } from './conversations/conversations.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { Conversation } from './entities/conversation.entity';
import { DatabaseInitService } from './database/database-init.service';
import { sslOptionFor } from './database/schema';

@Controller()
class HealthController {
  @Get()
  health() {
    return { status: 'ok', message: 'Customer Intelligence RAG API is running' };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Conversation],
      synchronize: true,
      retryAttempts: 10,
      retryDelay: 3000,
      ssl: sslOptionFor(process.env.DATABASE_URL),
    }),
    EmbeddingsModule,
    IngestModule,
    QueryModule,
    ConversationsModule,
  ],
  controllers: [HealthController],
  providers: [DatabaseInitService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
