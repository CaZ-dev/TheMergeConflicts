import { SEVERITY_META, SEVERITY_ORDER } from './severity.js';
import { DEVICE_LABELS } from '../../shared/viewport.js';

function Badge({ children, tone = 'neutral' }) {
  const tones = {
    live: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30',
    sample: 'bg-amber-400/10 text-amber-300 ring-amber-400/30',
    neutral: 'bg-ink-700/60 text-ink-200 ring-ink-600',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}>
      {children}
    </span>
  );
}

export default function Toolbar({ result, counts, filters, onToggleFilter, onOpenPrompt, onReset }) {
  const { audit, model, latencyMs, source, repaired, viewport } = result;
  const isLive = source === 'live';

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-ink-800 px-5 py-3">
      <Badge tone={isLive ? 'live' : 'sample'}>
        <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        {isLive ? `Live ${model}` : 'Cached sample response'}
      </Badge>

      {viewport && (
        <Badge>
          <span title={`${viewport.width}x${viewport.height} at ~${viewport.dpr}x`}>
            {DEVICE_LABELS[viewport.device]} · ~{viewport.cssWidth}px{viewport.source === 'auto' ? ' (auto)' : ''}
          </span>
        </Badge>
      )}
      {latencyMs != null && <Badge>{(latencyMs / 1000).toFixed(1)}s</Badge>}
      {audit.score != null && <Badge>Score {audit.score}/100</Badge>}
      {repaired && <Badge tone="sample">JSON repaired</Badge>}

      <div className="mx-1 h-5 w-px bg-ink-700" />

      {SEVERITY_ORDER.map((sev) => {
        const meta = SEVERITY_META[sev];
        const on = filters.includes(sev);
        return (
          <button
            key={sev}
            type="button"
            onClick={() => onToggleFilter(sev)}
            aria-pressed={on}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition
              ${on ? `${meta.chipOn} ${meta.ring}` : 'bg-transparent text-ink-400 ring-ink-700 hover:text-ink-200'}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${on ? meta.dot : 'bg-ink-600'}`} />
            {meta.label}
            <span className="tabular-nums opacity-70">{counts[sev] ?? 0}</span>
          </button>
        );
      })}

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenPrompt}
          aria-haspopup="dialog"
          className="rounded-md bg-ink-700/70 px-3 py-1.5 text-xs font-medium text-ink-200 ring-1 ring-inset ring-ink-600 transition hover:bg-ink-600"
        >
          Agent prompt…
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-ink-400 transition hover:text-ink-200"
        >
          New screenshot
        </button>
      </div>
    </div>
  );
}
