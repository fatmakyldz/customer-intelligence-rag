import { QueryResponse, IngestPayload, Conversation } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  query: (question: string) =>
    fetchApi<QueryResponse>('/query', {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),

  ingest: (payload: IngestPayload) =>
    fetchApi<{ id: string; message: string }>('/ingest', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  conversations: () => fetchApi<Conversation[]>('/conversations'),
};
