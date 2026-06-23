export interface ReasoningStep {
  step: number;
  action: string;
  input: string;
  output: string;
}

export type DocType =
  | 'sensor_log'
  | 'ups_event'
  | 'fire_alarm_event'
  | 'maintenance_report'
  | 'facility_document'
  | 'company_document';

export type RiskCategory = 'critical' | 'warning' | 'normal' | 'insight';

export interface SourceDoc {
  content: string;
  source: string;
  similarity: number;
  metadata: {
    type?: DocType | string;
    module?: string;
    severity?: string;
    metric?: string;
    [key: string]: unknown;
  };
}

export interface QueryResponse {
  answer: string;
  reasoning_steps: ReasoningStep[];
  sources: SourceDoc[];
  category: RiskCategory;
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
  type: DocType;
  metadata?: Record<string, unknown>;
}
