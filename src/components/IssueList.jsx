import { SEVERITY_META } from './severity.js';

export default function IssueList({ issues, activeId, onActivate }) {
  if (issues.length === 0) {
    return (
      <p className="px-5 py-8 text-sm text-ink-400">
        No issues match the current filters.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-ink-800">
      {issues.map((issue) => {
        const meta = SEVERITY_META[issue.severity];
        const active = activeId === issue.id;

        return (
          <li key={issue.id}>
            <div
              role="button"
              tabIndex={0}
              onMouseEnter={() => onActivate(issue.id)}
              onMouseLeave={() => onActivate(null)}
              onFocus={() => onActivate(issue.id)}
              onBlur={() => onActivate(null)}
              className={`cursor-default px-5 py-4 transition-colors ${active ? 'bg-ink-800/70' : 'hover:bg-ink-900'}`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums ${meta.pin}`}
                >
                  {issue.id}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="text-sm font-semibold text-white">{issue.title}</h3>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${meta.chipOn}`}>
                      {meta.label}
                    </span>
                    <span className="rounded bg-ink-800 px-1.5 py-0.5 text-[10px] text-ink-400">{issue.category}</span>
                    {issue.wcag && (
                      <span className="rounded bg-ink-800 px-1.5 py-0.5 text-[10px] text-ink-400">WCAG {issue.wcag}</span>
                    )}
                    {!issue.hasRegion && (
                      <span className="rounded bg-ink-800 px-1.5 py-0.5 text-[10px] text-ink-400">no region</span>
                    )}
                  </div>

                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-400">{issue.observation}</p>

                  {issue.fix && (
                    <p className="mt-2 border-l-2 border-emerald-400/40 pl-2.5 text-[13px] leading-relaxed text-emerald-200/90">
                      {issue.fix}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
