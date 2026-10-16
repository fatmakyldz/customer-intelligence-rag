import { QueryResponse, IngestPayload, Conversation } from '@/types';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

function friendlyError(status: number, body: string): string {
  if (status === 429) return 'Too many requests — please wait a minute and try again.';
  if (status === 401) return 'Adding documents requires the admin token.';
  try {
    const parsed = JSON.parse(body);
    const message = Array.isArray(parsed.message) ? parsed.message.join(', ') : parsed.message;
    if (message) return message;
  } catch {
    // not JSON
  }
  return body || `Request failed: ${status}`;
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });

  if (!res.ok) {
    throw new Error(friendlyError(res.status, await res.text()));
  }

  return res.json();
}

export const api = {
  query: (question: string) =>
    fetchApi<QueryResponse>('/query', {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),

  ingest: (payload: IngestPayload, adminToken?: string) =>
    fetchApi<{ id: string; message: string }>('/ingest', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: adminToken ? { 'x-admin-token': adminToken } : undefined,
    }),

  conversations: () => fetchApi<Conversation[]>('/conversations'),
};
