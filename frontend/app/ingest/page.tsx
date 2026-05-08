'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

type DocType = 'feedback' | 'sales_call' | 'documentation';

const typeDescriptions: Record<DocType, string> = {
  feedback: 'Customer reviews, complaints, feature requests, NPS responses',
  sales_call: 'Call notes, discovery summaries, deal context, objections',
  documentation: 'Product guides, API docs, FAQs, policy documents',
};

export default function IngestPage() {
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [type, setType] = useState<DocType>('feedback');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ id: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !source.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const metadata: Record<string, string> = { type };
      if (company) metadata.company = company;

      const res = await api.ingest({
        content: content.trim(),
        source: source.trim(),
        type,
        metadata,
      });

      setResult(res);
      setContent('');
      setSource('');
      setCompany('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ingest failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-surface-2 bg-surface-1 px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-300"
            >
              ← Dashboard
            </Link>
            <span className="text-gray-700">/</span>
            <span className="text-sm font-medium text-white">Add Documents</span>
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-blue text-sm font-bold text-white">
            CI
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="mb-8">
          <h1 className="mb-1 text-2xl font-semibold text-white">Add Document</h1>
          <p className="text-sm text-gray-500">
            Ingest customer feedback, sales calls, or documentation into the knowledge base.
            The system generates an embedding and stores it for semantic search.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Document type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Document Type</label>
            <div className="grid grid-cols-3 gap-3">
              {(['feedback', 'sales_call', 'documentation'] as DocType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    type === t
                      ? 'border-accent-blue bg-accent-blue/10 text-white'
                      : 'border-surface-3 bg-surface-1 text-gray-400 hover:border-surface-3 hover:bg-surface-2'
                  }`}
                >
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide">
                    {t.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-gray-500">{typeDescriptions[t]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Source name */}
          <div>
            <label htmlFor="source" className="mb-2 block text-sm font-medium text-gray-300">
              Source Name <span className="text-red-400">*</span>
            </label>
            <input
              id="source"
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. customer_feedback, sales_team, product_docs"
              className="w-full rounded-lg border border-surface-3 bg-surface-1 px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30"
              required
            />
          </div>

          {/* Company (optional) */}
          <div>
            <label htmlFor="company" className="mb-2 block text-sm font-medium text-gray-300">
              Company / Customer <span className="text-gray-600 text-xs">(optional)</span>
            </label>
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Corp, GlobalBank"
              className="w-full rounded-lg border border-surface-3 bg-surface-1 px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30"
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="mb-2 block text-sm font-medium text-gray-300">
              Content <span className="text-red-400">*</span>
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste the full text of the document here…"
              rows={10}
              className="w-full resize-none rounded-lg border border-surface-3 bg-surface-1 px-4 py-3 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30"
              required
              minLength={10}
            />
            <div className="mt-1 text-right text-xs text-gray-600">
              {content.length} characters
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !content.trim() || !source.trim()}
            className="w-full rounded-lg bg-accent-blue py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? 'Generating embedding & storing…' : 'Ingest Document →'}
          </button>
        </form>

        {/* Success */}
        {result && (
          <div className="mt-6 rounded-xl border border-green-800/50 bg-green-950/30 p-4">
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-green-400">
              <span>✓</span> Document ingested successfully
            </div>
            <div className="text-xs text-gray-500">
              ID: <span className="font-mono text-gray-400">{result.id}</span>
            </div>
            <div className="mt-3">
              <Link
                href="/"
                className="text-sm text-accent-blue hover:underline"
              >
                ← Go query the knowledge base
              </Link>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
            <span className="font-medium">Error: </span>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
