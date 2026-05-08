'use client';

import { useState } from 'react';
import { ReasoningStep } from '@/types';

const actionIcons: Record<string, string> = {
  vector_search: '🔍',
  categorize_insight: '🏷️',
};

const actionLabels: Record<string, string> = {
  vector_search: 'Semantic Search',
  categorize_insight: 'Categorize Insight',
};

export function ReasoningPath({ steps }: { steps: ReasoningStep[] }) {
  const [open, setOpen] = useState(false);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="rounded-lg border border-surface-3 bg-surface-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-300 hover:text-white"
      >
        <span className="flex items-center gap-2">
          <span className="text-accent-blue">⚡</span>
          Reasoning Path
          <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs text-gray-400">
            {steps.length} step{steps.length !== 1 ? 's' : ''}
          </span>
        </span>
        <span className="text-gray-500">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-surface-3 px-4 pb-4 pt-3">
          <div className="relative">
            <div className="absolute left-4 top-0 h-full w-px bg-surface-3" />
            <div className="space-y-4">
              {steps.map((step) => (
                <div key={step.step} className="relative pl-10">
                  <div className="absolute left-2 top-1 flex h-5 w-5 items-center justify-center rounded-full border border-accent-blue bg-surface-2 text-xs font-bold text-accent-blue">
                    {step.step}
                  </div>
                  <div className="rounded-lg border border-surface-3 bg-surface-2 p-3">
                    <div className="mb-1 flex items-center gap-2 text-xs font-medium text-accent-blue">
                      <span>{actionIcons[step.action] || '⚙️'}</span>
                      <span>{actionLabels[step.action] || step.action}</span>
                    </div>
                    <div className="mb-2 text-xs text-gray-500">
                      Input:{' '}
                      <span className="text-gray-400">
                        {step.input.length > 120 ? step.input.slice(0, 120) + '…' : step.input}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      <span className="text-gray-500">Output: </span>
                      {step.output.length > 200 ? step.output.slice(0, 200) + '…' : step.output}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
