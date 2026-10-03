import { SEVERITY_META } from './severity.js';

/**
 * Boxes are percentage-positioned divs over the image rather than canvas
 * strokes. box_2d is [ymin, xmin, ymax, xmax] normalized to 0-1000, so a
 * value divided by 10 is a CSS percentage directly. That means no scaling
 * math, correct alignment at every window size for free, and real hover and
 * keyboard focus on each region.
 */
export default function Overlay({ src, issues, activeId, onActivate, analyzing }) {
  return (
    <div className="relative inline-block w-full overflow-hidden rounded-xl ring-1 ring-ink-700">
      <img src={src} alt="Screenshot being audited" className="block w-full" />

      {analyzing && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden bg-ink-950/40">
          <div className="animate-sweep h-12 w-full bg-gradient-to-b from-transparent via-emerald-400/25 to-transparent" />
        </div>
      )}

      {!analyzing && issues.map((issue) => {
        if (!issue.hasRegion) return null;
        const [ymin, xmin, ymax, xmax] = issue.box_2d;
        const meta = SEVERITY_META[issue.severity];
        const active = activeId === issue.id;
        const dimmed = activeId != null && !active;

        return (
          <button
            key={issue.id}
            type="button"
            onMouseEnter={() => onActivate(issue.id)}
            onMouseLeave={() => onActivate(null)}
            onFocus={() => onActivate(issue.id)}
            onBlur={() => onActivate(null)}
            aria-label={`Issue ${issue.id}: ${issue.title}`}
            className={`absolute rounded-md border-2 transition-all duration-150 ${meta.box}
              ${active ? `${meta.tint} shadow-lg z-20 scale-[1.015]` : 'z-10'}
              ${dimmed ? 'opacity-25' : 'opacity-100'}`}
            style={{
              top: `${ymin / 10}%`,
              left: `${xmin / 10}%`,
              height: `${(ymax - ymin) / 10}%`,
              width: `${(xmax - xmin) / 10}%`,
            }}
          >
            <span
              className={`absolute -top-2.5 -left-2.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold tabular-nums ${meta.pin}`}
            >
              {issue.id}
            </span>
          </button>
        );
      })}
    </div>
  );
}
