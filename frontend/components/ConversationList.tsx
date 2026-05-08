import { Conversation } from '@/types';

const categoryDot: Record<string, string> = {
  opportunity: 'bg-green-400',
  risk: 'bg-red-400',
  neutral: 'bg-gray-500',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  conversations: Conversation[];
  onSelect: (c: Conversation) => void;
  activeId?: string;
}

export function ConversationList({ conversations, onSelect, activeId }: Props) {
  if (conversations.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-sm text-gray-600">
        No conversations yet. Ask your first question!
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c)}
          className={`w-full rounded-lg px-3 py-3 text-left transition-colors hover:bg-surface-2 ${
            activeId === c.id ? 'bg-surface-2 ring-1 ring-surface-3' : ''
          }`}
        >
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${categoryDot[c.category] || categoryDot.neutral}`}
            />
            <span className="truncate text-sm text-gray-300">{c.question}</span>
          </div>
          <div className="pl-4 text-xs text-gray-600">{timeAgo(c.created_at)}</div>
        </button>
      ))}
    </div>
  );
}
