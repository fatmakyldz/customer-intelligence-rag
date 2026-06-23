import { QueryResponse } from '@/types';
import { ReasoningPath } from './ReasoningPath';
import { SourceBadge } from './SourceBadge';

const categoryConfig = {
  critical: {
    label: 'Critical',
    color: 'bg-red-900/40 text-red-300 border-red-700',
    icon: '🔴',
  },
  warning: {
    label: 'Warning',
    color: 'bg-amber-900/40 text-amber-300 border-amber-700',
    icon: '🟠',
  },
  normal: {
    label: 'Normal',
    color: 'bg-green-900/40 text-green-300 border-green-700',
    icon: '🟢',
  },
  insight: {
    label: 'Insight',
    color: 'bg-blue-900/40 text-blue-300 border-blue-700',
    icon: '💡',
  },
};

export function ResponseDisplay({ response }: { response: QueryResponse }) {
  const cat = categoryConfig[response.category] || categoryConfig.normal;

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
            Retrieved Sources ({response.sources.length})
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
