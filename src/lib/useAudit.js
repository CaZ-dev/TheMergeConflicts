import { useCallback, useState } from 'react';
import { prepareImage } from './downscale.js';
import sampleAuditRaw from '../fixtures/sample-audit.json';
import { normalizeAudit } from '../../shared/normalize.js';

const SAMPLE_IMAGE = '/sample-screenshot.png';

/**
 * Audit lifecycle: idle -> preparing -> analyzing -> done | error.
 * `source` tells the UI whether a result came from the live model or the
 * bundled fixture, so a cached run is never shown as a live one.
 */
export function useAudit() {
  const [status, setStatus] = useState('idle');
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setPreview(null);
    setResult(null);
    setError(null);
  }, []);

  const audit = useCallback(async (file, notes) => {
    setError(null);
    setResult(null);
    setStatus('preparing');

    let prepared;
    try {
      prepared = await prepareImage(file);
    } catch (err) {
      setError({ message: err.message });
      setStatus('error');
      return;
    }

    setPreview(prepared.previewUrl);
    setStatus('analyzing');

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: prepared.image, notes }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setError({ message: payload?.error ?? `Request failed (${res.status})`, detail: payload?.detail });
        setStatus('error');
        return;
      }

      setResult({ ...payload, source: 'live' });
      setStatus('done');
    } catch {
      setError({ message: 'Could not reach the audit service. Is the dev server running?' });
      setStatus('error');
    }
  }, []);

  /** Bundled screenshot plus cached response. No network, no API key. */
  const loadSample = useCallback(async () => {
    setError(null);
    setResult(null);
    setPreview(SAMPLE_IMAGE);
    setStatus('analyzing');
    await new Promise((r) => setTimeout(r, 900));
    // Normalized through the same path as a live response, so the demo
    // exercises the real validation instead of trusting the fixture.
    setResult({
      audit: normalizeAudit(sampleAuditRaw),
      model: 'gemma-4-26b-a4b-it',
      latencyMs: null,
      source: 'sample',
    });
    setStatus('done');
  }, []);

  return { status, preview, result, error, audit, loadSample, reset };
}
