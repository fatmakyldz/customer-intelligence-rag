import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Styled renderers for the LLM's Markdown answers (tables, lists, headings, bold).
// Raw HTML in the answer is not rendered — react-markdown escapes it by default.
const components: Components = {
  h1: ({ children }) => <h3 className="mb-2 mt-5 text-base font-semibold text-white first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-2 mt-5 text-base font-semibold text-white first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-2 mt-4 text-sm font-semibold text-white first:mt-0">{children}</h4>,
  h4: ({ children }) => <h4 className="mb-2 mt-4 text-sm font-semibold text-gray-100 first:mt-0">{children}</h4>,
  p: ({ children }) => <p className="mb-3 leading-relaxed text-gray-200 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="text-gray-300">{children}</em>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 text-gray-200 marker:text-gray-500">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-gray-200 marker:text-gray-500">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-gray-100">{children}</code>
  ),
  hr: () => <hr className="my-4 border-surface-3" />,
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-surface-3 pl-3 text-gray-400">{children}</blockquote>
  ),
  table: ({ children }) => (
    <div className="mb-4 overflow-x-auto rounded-lg border border-surface-3">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-surface-2 text-xs uppercase tracking-wide text-gray-400">{children}</thead>,
  th: ({ children }) => <th className="px-3 py-2 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-t border-surface-3 px-3 py-2 align-top text-gray-200">{children}</td>,
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
