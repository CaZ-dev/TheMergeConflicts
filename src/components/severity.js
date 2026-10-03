export const SEVERITY_ORDER = ['critical', 'serious', 'minor'];

export const SEVERITY_META = {
  critical: {
    label: 'Critical',
    dot: 'bg-rose-400',
    chipOn: 'bg-rose-400/10 text-rose-300',
    ring: 'ring-rose-400/30',
    box: 'border-rose-400',
    pin: 'bg-rose-400 text-ink-950',
    tint: 'bg-rose-400/10',
  },
  serious: {
    label: 'Serious',
    dot: 'bg-amber-400',
    chipOn: 'bg-amber-400/10 text-amber-300',
    ring: 'ring-amber-400/30',
    box: 'border-amber-400',
    pin: 'bg-amber-400 text-ink-950',
    tint: 'bg-amber-400/10',
  },
  minor: {
    label: 'Minor',
    dot: 'bg-sky-400',
    chipOn: 'bg-sky-400/10 text-sky-300',
    ring: 'ring-sky-400/30',
    box: 'border-sky-400',
    pin: 'bg-sky-400 text-ink-950',
    tint: 'bg-sky-400/10',
  },
};
