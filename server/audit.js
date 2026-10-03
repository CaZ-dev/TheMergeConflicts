import { SYSTEM_INSTRUCTION, buildUserPrompt, REPAIR_PROMPT } from './prompt.js';
import { normalizeAudit } from '../shared/normalize.js';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
export const DEFAULT_MODEL = 'gemma-4-26b-a4b-it';

export class AuditError extends Error {
  constructor(message, status = 500, detail = null) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Pull a JSON object out of a model response that may be fenced or chatty.
 * Gemma on the Gemini API has no server-enforced response schema, so the
 * JSON contract is prompted and must be parsed defensively.
 */
export function extractJson(text) {
  if (!text) throw new Error('empty response');
  let body = text.trim();

  // Strip a ```json ... ``` fence if present.
  const fence = body.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) body = fence[1].trim();

  // Fall back to the outermost brace pair.
  if (!body.startsWith('{')) {
    const first = body.indexOf('{');
    const last = body.lastIndexOf('}');
    if (first === -1 || last <= first) throw new Error('no JSON object found');
    body = body.slice(first, last + 1);
  }
  return JSON.parse(body);
}

async function callGemma({ apiKey, model, parts, allowSystem }) {
  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
  };
  if (allowSystem) {
    body.systemInstruction = { parts: [{ text: SYSTEM_INSTRUCTION }] };
  }

  const res = await fetch(`${API_BASE}/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message = json?.error?.message ?? `Gemini API returned ${res.status}`;
    const err = new AuditError(message, res.status, json?.error ?? null);
    // Some models reject systemInstruction; signal the caller to inline it.
    err.systemUnsupported = allowSystem && /system.?instruction/i.test(message);
    throw err;
  }

  const text = (json?.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p?.text ?? '')
    .join('')
    .trim();

  if (!text) {
    const reason = json?.candidates?.[0]?.finishReason ?? 'unknown';
    throw new AuditError(`Gemma returned no text (finishReason: ${reason})`, 502, json);
  }
  return text;
}

/**
 * Run one audit. `image` is { mimeType, data } where data is bare base64.
 * Returns { audit, raw, model, latencyMs, repaired }.
 */
export async function runAudit({ image, notes, apiKey, model = DEFAULT_MODEL }) {
  if (!apiKey) {
    throw new AuditError(
      'No GEMINI_API_KEY configured. Copy .env.example to .env and add a key from aistudio.google.com, then restart the dev server. The "Load sample" button works without a key.',
      503,
    );
  }
  if (!image?.data || !image?.mimeType) {
    throw new AuditError('No image supplied.', 400);
  }

  const baseParts = [
    { inline_data: { mime_type: image.mimeType, data: image.data } },
    { text: buildUserPrompt(notes) },
  ];

  const started = Date.now();
  let allowSystem = true;
  let text;
  try {
    text = await callGemma({ apiKey, model, parts: baseParts, allowSystem });
  } catch (err) {
    if (!err.systemUnsupported) throw err;
    allowSystem = false;
    text = await callGemma({
      apiKey,
      model,
      parts: [
        { inline_data: { mime_type: image.mimeType, data: image.data } },
        { text: `${SYSTEM_INSTRUCTION}\n\n${buildUserPrompt(notes)}` },
      ],
      allowSystem: false,
    });
  }

  let raw;
  let repaired = false;
  try {
    raw = extractJson(text);
  } catch {
    // One repair attempt: hand the bad output back and ask for clean JSON.
    repaired = true;
    const retryParts = [
      ...(allowSystem
        ? baseParts
        : [baseParts[0], { text: `${SYSTEM_INSTRUCTION}\n\n${buildUserPrompt(notes)}` }]),
    ];
    const retryText = await callGemma({
      apiKey,
      model,
      allowSystem,
      parts: [...retryParts, { text: `Your previous reply was:\n${text}\n\n${REPAIR_PROMPT}` }],
    });
    try {
      raw = extractJson(retryText);
    } catch {
      throw new AuditError(
        'Gemma did not return parseable JSON. Try again, or use the sample input.',
        502,
        { modelText: text.slice(0, 1200) },
      );
    }
  }

  return {
    audit: normalizeAudit(raw),
    model,
    latencyMs: Date.now() - started,
    repaired,
  };
}
