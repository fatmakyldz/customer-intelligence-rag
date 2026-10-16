import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatGroq } from '@langchain/groq';
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { z } from 'zod';
import { Conversation } from '../entities/conversation.entity';
import { QueryDto } from './dto/query.dto';
import { EmbeddingsService } from '../embeddings/embeddings.service';

// Groq free tier. Override with GROQ_MODEL (e.g. llama-3.3-70b-versatile, llama-3.1-8b-instant).
const DEFAULT_MODEL = 'openai/gpt-oss-120b';

export interface QueryResult {
  answer: string;
  reasoning_steps: ReasoningStep[];
  sources: SourceDoc[];
  category: string;
}

export interface ReasoningStep {
  step: number;
  action: string;
  input: string;
  output: string;
}

export interface SourceDoc {
  content: string;
  source: string;
  similarity: number;
  metadata: Record<string, any>;
}

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);
  private readonly llm: ChatGroq;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    private readonly embeddings: EmbeddingsService,
  ) {
    this.llm = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || DEFAULT_MODEL,
      temperature: 0,
      maxRetries: 2,
    });
  }

  private buildTools(capturedSources: SourceDoc[]) {
    const vectorSearchTool = new DynamicStructuredTool({
      name: 'vector_search',
      description:
        'Search the knowledge base for relevant documents using semantic similarity. Use this to find customer feedback, sales call summaries, or documentation.',
      // Cast keeps tsc from deep-instantiating zod generics (OOM with zod 3.25 + langchain).
      schema: z.object({
        query: z.string().describe('The search query to find relevant documents'),
      }) as any,
      func: async ({ query }: { query: string }) => {
        const vectorStr = await this.embeddings.embedAsVectorLiteral(query);

        const rows = await this.dataSource.query(
          `SELECT content, metadata, source,
                  1 - (embedding <=> $1::vector) AS similarity
           FROM documents
           ORDER BY embedding <=> $1::vector
           LIMIT 5`,
          [vectorStr],
        );

        rows.forEach((row: any) => {
          const exists = capturedSources.some((s) => s.content === row.content);
          if (!exists) {
            capturedSources.push({
              content: row.content,
              source: row.source,
              similarity: parseFloat(row.similarity),
              metadata: row.metadata || {},
            });
          }
        });

        if (rows.length === 0) {
          return 'No relevant documents found in the knowledge base.';
        }

        return rows
          .map(
            (r: any, i: number) =>
              `[${i + 1}] Source: ${r.source} (similarity: ${parseFloat(r.similarity).toFixed(3)})\n${r.content}`,
          )
          .join('\n\n');
      },
    });

    const categorizeTool = new DynamicStructuredTool({
      name: 'categorize_insight',
      description:
        'Categorize the main business insight from the analysis as opportunity, risk, or neutral. Call this after you have gathered enough information.',
      schema: z
        .object({
          insight: z.string().describe('The main business insight to categorize'),
          reasoning: z
            .string()
            .describe('Why this insight is categorized as opportunity, risk, or neutral'),
          category: z
            .string()
            .describe('The category: must be one of "opportunity", "risk", or "neutral"'),
        })
        .passthrough() as any,
      func: async ({ insight, reasoning, category }: { insight: string; reasoning: string; category: string }) => {
        const raw = String(category ?? '').toLowerCase().trim();
        const normalized =
          ['opportunity', 'risk', 'neutral'].find((c) => raw.includes(c)) ?? 'neutral';
        return JSON.stringify({ category: normalized, insight, reasoning });
      },
    });

    return [vectorSearchTool, categorizeTool];
  }

  async query(dto: QueryDto): Promise<QueryResult> {
    this.logger.log(`Processing query: ${dto.question}`);

    const capturedSources: SourceDoc[] = [];
    const tools = this.buildTools(capturedSources);

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a Customer Intelligence AI. Analyze business data and extract actionable insights. Always show your reasoning step by step.

When answering a question:
1. Use vector_search to find relevant information from the knowledge base
2. Analyze the retrieved context carefully
3. Use categorize_insight to classify the main insight as opportunity, risk, or neutral
4. Provide a clear, specific, actionable answer

Be data-driven, reference specific details from the retrieved documents, and highlight key patterns.`,
      ],
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad'),
    ]);

    const agent = await createToolCallingAgent({
      llm: this.llm,
      tools,
      prompt,
    });

    const executor = new AgentExecutor({
      agent,
      tools,
      returnIntermediateSteps: true,
      maxIterations: 6,
      verbose: false,
      handleParsingErrors: true,
    });

    const result = await executor.invoke({ input: dto.question });
    this.logger.log(`Query complete. Output length: ${result.output?.length ?? 0}, steps: ${result.intermediateSteps?.length ?? 0}`);

    const reasoning_steps: ReasoningStep[] = (result.intermediateSteps || []).map(
      (step: any, idx: number) => ({
        step: idx + 1,
        action: step.action?.tool || 'unknown',
        input:
          typeof step.action?.toolInput === 'object'
            ? JSON.stringify(step.action.toolInput)
            : String(step.action?.toolInput || ''),
        output:
          typeof step.observation === 'string'
            ? step.observation.slice(0, 500)
            : JSON.stringify(step.observation).slice(0, 500),
      }),
    );

    let category = 'neutral';
    for (const step of result.intermediateSteps || []) {
      if (step.action?.tool === 'categorize_insight') {
        try {
          const parsed =
            typeof step.observation === 'string'
              ? JSON.parse(step.observation)
              : step.observation;
          if (parsed?.category) {
            category = parsed.category;
          }
        } catch {
          // categorize_insight output wasn't JSON — fall back to neutral
        }
      }
    }

    const conversation = this.conversationRepo.create({
      question: dto.question,
      answer: result.output,
      sources: capturedSources,
      reasoning_steps,
      category,
    });
    await this.conversationRepo.save(conversation);

    return {
      answer: result.output,
      reasoning_steps,
      sources: capturedSources,
      category,
    };
  }
}
