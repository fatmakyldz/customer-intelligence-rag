import { Module, Controller, Get } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngestModule } from './ingest/ingest.module';
import { QueryModule } from './query/query.module';
import { ConversationsModule } from './conversations/conversations.module';
import { Conversation } from './entities/conversation.entity';

@Controller()
class HealthController {
  @Get()
  health() {
    return { status: 'ok', message: 'MOD-DC Local Intelligence Platform API is running' };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Conversation],
      synchronize: true,
      retryAttempts: 10,
      retryDelay: 3000,
      ssl: false,
    }),
    IngestModule,
    QueryModule,
    ConversationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
