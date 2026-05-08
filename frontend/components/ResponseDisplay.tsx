import { QueryResponse } from '@/types';
import { ReasoningPath } from './ReasoningPath';
import { SourceBadge } from './SourceBadge';

const categoryConfig = {
  opportunity: {
    label: 'Opportunity',
    color: 'bg-green-900/40 text-green-300 border-green-700',
    icon: '📈',
  },
  risk: {
    label: 'Risk',
    color: 'bg-red-900/40 text-red-300 border-red-700',
    icon: '⚠️',
  },
  neutral: {
    label: 'Neutral',
    color: 'bg-gray-800 text-gray-300 border-gray-600',
    icon: '➖',
  },
};

export function ResponseDisplay({ response }: { response: QueryResponse }) {
  const cat = categoryConfig[response.category] || categoryConfig.neutral;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-surface-3 bg-surface-1 p-5">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Analysis
          </span>
          <span className={`rounded-full border px-3 py-0.5 text-xs font-medium ${cat.color}`}>
            {cat.icon} {cat.label}
          </span>
        </div>
        <p className="leading-relaxed text-gray-200">{response.answer}</p>
      </div>

      <ReasoningPath steps={response.reasoning_steps} />

      {response.sources && response.sources.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Sources ({response.sources.length})
          </h3>
          <div className="space-y-2">
            {response.sources.map((source, i) => (
              <SourceBadge key={i} source={source} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
