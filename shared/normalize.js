// Shared by the server route and the cached-fixture loader so both paths
// produce exactly the same shape. The fixture is normalized too, which means
// the demo path exercises the same validation the live path does.

const SEVERITIES = new Set(['critical', 'serious', 'minor']);
const CATEGORIES = new Set([
  'contrast', 'tap-target', 'labeling', 'hierarchy', 'copy', 'consistency', 'state', 'layout',
]);

const clamp1000 = (n) => Math.min(1000, Math.max(0, Math.round(n)));

/**
 * Validate one [ymin, xmin, ymax, xmax] box normalized to 0-1000.
 * Returns null when the box is unusable, so the caller can keep the issue in
 * the list and render it without a region instead of dropping it.
 */
export function normalizeBox(box) {
  if (!Array.isArray(box) || box.length !== 4) return null;
  const nums = box.map(Number);
  if (nums.some((n) => !Number.isFinite(n))) return null;

  let [ymin, xmin, ymax, xmax] = nums.map(clamp1000);
  if (ymin > ymax) [ymin, ymax] = [ymax, ymin];
  if (xmin > xmax) [xmin, xmax] = [xmax, xmin];

  // A degenerate box would render as an invisible sliver.
  if (ymax - ymin < 4 || xmax - xmin < 4) return null;
  return [ymin, xmin, ymax, xmax];
}

/** Coerce whatever the model returned into the shape the UI renders. */
export function normalizeAudit(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('response was not an object');

  const issuesIn = Array.isArray(raw.issues) ? raw.issues : [];
  const issues = issuesIn.map((issue, i) => {
    const box = normalizeBox(issue?.box_2d ?? issue?.box ?? issue?.bbox);
    const severity = String(issue?.severity ?? '').toLowerCase();
    const category = String(issue?.category ?? '').toLowerCase();
    return {
      id: Number.isFinite(Number(issue?.id)) ? Number(issue.id) : i + 1,
      title: String(issue?.title ?? 'Untitled issue').trim(),
      category: CATEGORIES.has(category) ? category : 'other',
      severity: SEVERITIES.has(severity) ? severity : 'minor',
      wcag: issue?.wcag ? String(issue.wcag).trim() : null,
      observation: String(issue?.observation ?? '').trim(),
      fix: String(issue?.fix ?? '').trim(),
      box_2d: box,
      hasRegion: box !== null,
    };
  });

  const order = { critical: 0, serious: 1, minor: 2 };
  issues.sort((a, b) => order[a.severity] - order[b.severity]);
  issues.forEach((issue, i) => { issue.id = i + 1; });

  const score = Number(raw.score);
  return {
    summary: String(raw.summary ?? '').trim() || 'Audit complete.',
    score: Number.isFinite(score) ? Math.min(100, Math.max(0, Math.round(score))) : null,
    issues,
  };
}
