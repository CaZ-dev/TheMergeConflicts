import { useCallback, useEffect, useMemo, useState } from 'react';
import DropZone from './components/DropZone.jsx';
import Overlay from './components/Overlay.jsx';
import IssueList from './components/IssueList.jsx';
import Toolbar from './components/Toolbar.jsx';
import PromptEditor from './components/PromptEditor.jsx';
import { SEVERITY_ORDER } from './components/severity.js';
import { useAudit } from './lib/useAudit.js';
import { buildAgentPrompt } from './lib/agentPrompt.js';

const ALL = SEVERITY_ORDER;

export default function App() {
  const { status, preview, result, error, audit, loadSample, reset } = useAudit();
  const [notes, setNotes] = useState('');
  const [viewportChoice, setViewportChoice] = useState('auto');
  const [activeId, setActiveId] = useState(null);
  const [filters, setFilters] = useState(ALL);
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptDraft, setPromptDraft] = useState(null);

  // ?demo=1 opens straight into the cached sample, for a zero-risk demo start.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('demo') === '1') loadSample();
  }, [loadSample]);

  const issues = result?.audit?.issues ?? [];
  const visible = useMemo(
    () => issues.filter((i) => filters.includes(i.severity)),
    [issues, filters],
  );

  const counts = useMemo(() => {
    const c = {};
    for (const sev of ALL) c[sev] = issues.filter((i) => i.severity === sev).length;
    return c;
  }, [issues]);

  const toggleFilter = useCallback((sev) => {
    setFilters((f) => (f.includes(sev) ? f.filter((s) => s !== sev) : [...f, sev]));
  }, []);

  const generatedPrompt = useMemo(
    () => buildAgentPrompt(visible, result?.viewport),
    [visible, result],
  );

  const closePrompt = useCallback(() => setPromptOpen(false), []);

  const startOver = useCallback(() => {
    reset();
    setActiveId(null);
    setFilters(ALL);
    setPromptOpen(false);
    setPromptDraft(null);
  }, [reset]);

  const busy = status === 'preparing' || status === 'analyzing';

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center gap-3 border-b border-ink-800 px-5 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-400 font-bold text-ink-950">L</div>
        <div>
          <h1 className="text-sm font-semibold text-white">Lens</h1>
          <p className="text-xs text-ink-400">Gemma 4 looks at your screenshot and shows you what is wrong, where.</p>
        </div>
        <span className="ml-auto hidden text-xs text-ink-600 sm:block">Gemma 4 · Gemini API</span>
      </header>

      <main className="flex-1">
        {!result && (
          <div className="px-5 py-14">
            {busy ? (
              <div className="mx-auto w-full max-w-xl">
                {preview && <Overlay src={preview} issues={[]} activeId={null} onActivate={() => {}} analyzing />}
                <p className="mt-4 text-center text-sm text-ink-400">
                  {status === 'preparing' ? 'Preparing image…' : 'Gemma 4 is reading the screenshot…'}
                </p>
              </div>
            ) : (
              <>
                <DropZone
                  onFile={(f) => audit(f, notes, viewportChoice)}
                  onSample={loadSample}
                  notes={notes}
                  onNotesChange={setNotes}
                  viewportChoice={viewportChoice}
                  onViewportChange={setViewportChoice}
                  busy={busy}
                />
                {error && (
                  <div className="mx-auto mt-6 w-full max-w-xl rounded-lg border border-rose-400/30 bg-rose-400/5 px-4 py-3">
                    <p className="text-sm text-rose-200">{error.message}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {result && (
          <div>
            <Toolbar
              result={result}
              counts={counts}
              filters={filters}
              onToggleFilter={toggleFilter}
              onOpenPrompt={() => setPromptOpen(true)}
              onReset={startOver}
            />

            <p className="border-b border-ink-800 px-5 py-3 text-sm text-ink-200">{result.audit.summary}</p>

            <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <div className="lg:sticky lg:top-5 lg:self-start">
                <Overlay
                  src={preview}
                  issues={visible}
                  activeId={activeId}
                  onActivate={setActiveId}
                  analyzing={false}
                />
              </div>

              <div className="rounded-xl border border-ink-800 bg-ink-900/40">
                <IssueList issues={visible} activeId={activeId} onActivate={setActiveId} />
              </div>
            </div>

            <PromptEditor
              open={promptOpen}
              onClose={closePrompt}
              generated={generatedPrompt}
              draft={promptDraft}
              onDraftChange={setPromptDraft}
            />
          </div>
        )}
      </main>
    </div>
  );
}
