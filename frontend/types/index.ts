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
  metadata: {
    type?: string;
    company?: string;
    customer?: string;
    sentiment?: string;
    category?: string;
    [key: string]: unknown;
  };
}

export interface QueryResponse {
  answer: string;
  reasoning_steps: ReasoningStep[];
  sources: SourceDoc[];
  category: 'opportunity' | 'risk' | 'neutral';
}

export interface Conversation {
  id: string;
  question: string;
  answer: string;
  sources: SourceDoc[];
  reasoning_steps: ReasoningStep[];
  category: string;
  created_at: string;
}

export interface IngestPayload {
  content: string;
  source: string;
  type: 'feedback' | 'sales_call' | 'documentation';
  metadata?: Record<string, unknown>;
}
