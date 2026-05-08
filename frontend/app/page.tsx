'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { QueryResponse, Conversation } from '@/types';
import { ResponseDisplay } from '@/components/ResponseDisplay';
import { ConversationList } from '@/components/ConversationList';

const EXAMPLE_QUERIES = [
  'What are customers saying about our API rate limits?',
  'What are the biggest sales opportunities this quarter?',
  'Are there any churn risks I should know about?',
  'What compliance requirements do enterprise customers need?',
];

export default function DashboardPage() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    try {
      const data = await api.conversations();
      setConversations(data);
    } catch {
      // silently ignore if backend not yet ready
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await api.query(question.trim());
      setResponse(result);
      setActiveId(undefined);
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectConversation(c: Conversation) {
    setActiveId(c.id);
    setQuestion(c.question);
    setResponse({
      answer: c.answer,
      reasoning_steps: c.reasoning_steps,
      sources: c.sources,
      category: c.category as QueryResponse['category'],
    });
    setError(null);
  }

  function handleExampleQuery(q: string) {
    setQuestion(q);
    textareaRef.current?.focus();
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-72 shrink-0 flex-col border-r border-surface-2 bg-surface-1">
        <div className="border-b border-surface-2 px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-blue text-sm font-bold text-white">
              CI
            </div>
            <span className="font-semibold text-white">Customer Intelligence</span>
          </div>
        </div>

        <div className="border-b border-surface-2 px-4 py-3">
          <Link
            href="/ingest"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-surface-3 bg-surface-2 px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-surface-3 hover:text-white"
          >
            <span>+</span> Add Documents
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
            Recent ({conversations.length})
          </div>
          <ConversationList
            conversations={conversations}
            onSelect={handleSelectConversation}
            activeId={activeId}
          />
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-surface-2 px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-white">Intelligence Dashboard</h1>
            <p className="text-xs text-gray-500">Ask anything about your customers, sales, or docs</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            RAG System Active
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-6">
            {/* Query form */}
            <form onSubmit={handleSubmit} className="mb-6">
              <div className="overflow-hidden rounded-xl border border-surface-3 bg-surface-1 focus-within:border-accent-blue focus-within:ring-1 focus-within:ring-accent-blue/30">
                <textarea
                  ref={textareaRef}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Ask about customers, sales opportunities, risks, compliance requirements…"
                  className="w-full resize-none bg-transparent px-4 pt-4 pb-2 text-sm text-gray-200 placeholder-gray-600 outline-none"
                  rows={3}
                />
                <div className="flex items-center justify-between px-4 pb-3">
                  <span className="text-xs text-gray-600">Enter to send · Shift+Enter for newline</span>
                  <button
                    type="submit"
                    disabled={loading || !question.trim()}
                    className="rounded-lg bg-accent-blue px-4 py-1.5 text-sm font-medium text-white transition-opacity disabled:opacity-40 hover:opacity-90"
                  >
                    {loading ? 'Analyzing…' : 'Analyze →'}
                  </button>
                </div>
              </div>
            </form>

            {/* Example queries */}
            {!response && !loading && (
              <div className="mb-8">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-600">
                  Try an example
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {EXAMPLE_QUERIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleExampleQuery(q)}
                      className="rounded-lg border border-surface-3 bg-surface-1 px-3 py-2.5 text-left text-xs text-gray-400 transition-colors hover:border-accent-blue/50 hover:bg-surface-2 hover:text-gray-200"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="rounded-xl border border-surface-3 bg-surface-1 p-8 text-center">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-accent-blue/30 bg-accent-blue/10">
                  <span className="animate-pulse text-accent-blue">⚡</span>
                </div>
                <p className="text-sm text-gray-400">
                  Agent is analyzing your question…
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  Searching knowledge base and reasoning through the data
                </p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
                <span className="font-medium">Error: </span>
                {error}
              </div>
            )}

            {/* Response */}
            {response && !loading && <ResponseDisplay response={response} />}
          </div>
        </div>
      </main>
    </div>
  );
}
