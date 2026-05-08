import { SourceDoc } from '@/types';

const typeColors: Record<string, string> = {
  feedback: 'bg-purple-900/50 text-purple-300 border-purple-700',
  sales_call: 'bg-blue-900/50 text-blue-300 border-blue-700',
  documentation: 'bg-green-900/50 text-green-300 border-green-700',
};

const typeLabels: Record<string, string> = {
  feedback: 'Feedback',
  sales_call: 'Sales Call',
  documentation: 'Docs',
};

export function SourceBadge({ source }: { source: SourceDoc }) {
  const docType = (source.metadata?.type as string) || 'documentation';
  const colorClass = typeColors[docType] || typeColors.documentation;
  const label = typeLabels[docType] || docType;

  return (
    <div className="rounded-lg border border-surface-3 bg-surface-2 p-3 text-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${colorClass}`}>
          {label}
        </span>
        {source.metadata?.company && (
          <span className="text-gray-400">{source.metadata.company as string}</span>
        )}
        {source.metadata?.sentiment && (
          <span
            className={`text-xs ${
              source.metadata.sentiment === 'positive' ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {source.metadata.sentiment as string}
          </span>
        )}
        <span className="ml-auto text-xs text-gray-500">
          {(source.similarity * 100).toFixed(1)}% match
        </span>
      </div>
      <p className="line-clamp-3 text-gray-300">{source.content}</p>
    </div>
  );
}
