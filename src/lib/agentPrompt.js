import { DEVICE_LABELS } from '../../shared/viewport.js';

/** The starting text for the prompt editor, built from the visible issues. */
export function buildAgentPrompt(issues, viewport) {
  const lines = issues.map(
    (i) => `${i.id}. [${i.severity}] ${i.title}\n   Problem: ${i.observation}\n   Fix: ${i.fix}`,
  );
  const where = viewport
    ? `a ${DEVICE_LABELS[viewport.device].toLowerCase()} screenshot (about ${viewport.cssWidth} CSS px wide)`
    : 'a screenshot';
  return `Fix these UI and accessibility issues found in ${where} of this interface:\n\n${lines.join('\n\n')}`;
}
