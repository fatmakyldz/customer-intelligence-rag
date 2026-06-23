import { SourceDoc } from '@/types';

const typeColors: Record<string, string> = {
  sensor_log: 'bg-cyan-900/50 text-cyan-300 border-cyan-700',
  ups_event: 'bg-amber-900/50 text-amber-300 border-amber-700',
  fire_alarm_event: 'bg-red-900/50 text-red-300 border-red-700',
  maintenance_report: 'bg-blue-900/50 text-blue-300 border-blue-700',
  facility_document: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
  company_document: 'bg-purple-900/50 text-purple-300 border-purple-700',
};

const typeLabels: Record<string, string> = {
  sensor_log: 'Sensor Log',
  ups_event: 'UPS Event',
  fire_alarm_event: 'Fire Alarm',
  maintenance_report: 'Maintenance',
  facility_document: 'Facility Doc',
  company_document: 'Company Doc',
};

export function SourceBadge({ source }: { source: SourceDoc }) {
  const docType = (source.metadata?.type as string) || 'facility_document';
  const colorClass = typeColors[docType] || typeColors.facility_document;
  const label = typeLabels[docType] || docType;

  return (
    <div className="rounded-lg border border-surface-3 bg-surface-2 p-3 text-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${colorClass}`}>
          {label}
        </span>
        {source.metadata?.module && (
          <span className="text-gray-400">{source.metadata.module as string}</span>
        )}
        {source.metadata?.severity && (
          <span
            className={`text-xs ${
              source.metadata.severity === 'critical'
                ? 'text-red-400'
                : source.metadata.severity === 'warning'
                  ? 'text-amber-400'
                  : 'text-green-400'
            }`}
          >
            {source.metadata.severity as string}
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
