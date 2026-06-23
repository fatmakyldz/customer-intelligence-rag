import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatOllama } from '@langchain/ollama';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/hf_transformers';
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { z } from 'zod';
import { Conversation } from '../entities/conversation.entity';
import { QueryDto } from './dto/query.dto';

interface QueryResult {
  answer: string;
  reasoning_steps: ReasoningStep[];
  sources: SourceDoc[];
  category: string;
}

interface ReasoningStep {
  step: number;
  action: string;
  input: string;
  output: string;
}

interface SourceDoc {
  content: string;
  source: string;
  similarity: number;
  metadata: Record<string, any>;
}

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);
  private readonly embeddings: HuggingFaceTransformersEmbeddings;
  private readonly llm: ChatOllama;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
  ) {
    this.embeddings = new HuggingFaceTransformersEmbeddings({
      modelName: 'Xenova/all-MiniLM-L6-v2',
    });

    // Fully local LLM via Ollama (offline / edge data center friendly).
    // Default model: qwen2.5. Fallback options: llama3.1, mistral (see README).
    this.llm = new ChatOllama({
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'qwen2.5',
      temperature: 0,
    });
  }

  private buildTools(capturedSources: SourceDoc[]) {
    const vectorSearchTool = new DynamicStructuredTool({
      name: 'vector_search',
      description:
        'Search the facility knowledge base for relevant records using semantic similarity. Use this to retrieve sensor logs, UPS events, fire alarm events, maintenance reports, facility documents, and company documents.',
      schema: z.object({
        query: z.string().describe('The search query to find relevant facility records'),
      }),
      func: async ({ query }) => {
        const vector = await this.embeddings.embedQuery(query);
        const vectorStr = `[${vector.join(',')}]`;

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
      name: 'classify_risk',
      description:
        'Classify the operational risk level of the analysis as critical, warning, normal, or insight. Call this after you have gathered enough evidence. ' +
        'Use "critical" for imminent threats of data loss, overheating, UPS failure, fire-system failure, or downtime; ' +
        '"warning" for degrading conditions trending toward a threshold; ' +
        '"normal" when readings are within safe operating limits; ' +
        '"insight" for a notable observation or optimization opportunity that is not an active risk.',
      schema: z
        .object({
          finding: z.string().describe('The main operational finding to classify'),
          reasoning: z
            .string()
            .describe('Why this finding is classified at this risk level, referencing the evidence'),
          category: z
            .string()
            .describe('The risk level: must be one of "critical", "warning", "normal", or "insight"'),
        })
        .passthrough(),
      func: async ({ finding, reasoning, category }) => {
        const raw = String(category ?? '').toLowerCase().trim();
        const normalized =
          ['critical', 'warning', 'normal', 'insight'].find((c) => raw.includes(c)) ?? 'normal';
        return JSON.stringify({ category: normalized, finding, reasoning });
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
        `You are the MOD-DC Local Intelligence assistant, a data center risk analyst for modular edge data centers. You analyze server room documents, sensor logs (temperature, humidity), UPS events, fire alarm records, maintenance reports, and facility/company documents to protect uptime and prevent data loss.

When answering a question:
1. Use vector_search to retrieve relevant facility records (sensor logs, UPS events, fire alarm events, maintenance reports, facility/company documents).
2. Analyze the retrieved evidence carefully. Explicitly assess whether there is a risk of: data loss / disk failure, overheating (high temperature or humidity), UPS failure (low battery runtime or battery degradation), fire-system failure (alarm panel faults), or operational downtime.
3. Use classify_risk to classify the overall finding as critical, warning, normal, or insight.
4. Provide a clear, specific answer that (a) cites the retrieved sources by their source name, and (b) recommends practical, concrete remediation actions.

Be precise and data-driven. Reference specific values from the retrieved records (temperatures, humidity %, battery runtime minutes, dates, panel IDs). Never invent readings that are not in the evidence. If the evidence is insufficient, say so.`,
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

    let category = 'normal';
    for (const step of result.intermediateSteps || []) {
      if (step.action?.tool === 'classify_risk') {
        try {
          const parsed =
            typeof step.observation === 'string'
              ? JSON.parse(step.observation)
              : step.observation;
          if (parsed?.category) {
            category = parsed.category;
          }
        } catch {
          // classify_risk output wasn't JSON — fall back to normal
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
