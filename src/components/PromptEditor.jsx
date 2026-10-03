import { useEffect, useRef, useState } from 'react';

const MOD_KEY = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+';

/**
 * Modal editor for the agent prompt. `draft` is null until the user types,
 * so an untouched prompt keeps tracking the severity filters, and an edited
 * one is never silently overwritten by them.
 */
export default function PromptEditor({ open, onClose, generated, draft, onDraftChange }) {
  const dialogRef = useRef(null);
  const textRef = useRef(null);
  const copyTimer = useRef(null);
  // 'idle' | 'copied' | 'manual' (clipboard refused, text left selected)
  const [copyState, setCopyState] = useState('idle');
  const value = draft ?? generated;
  const edited = draft !== null && draft !== generated;

  // A native <dialog> gives focus trapping, Escape to close, and a backdrop.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      textRef.current?.focus();
      textRef.current?.setSelectionRange(0, 0);
      textRef.current?.scrollTo(0, 0);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Escape closes the dialog natively. Listen on the element itself so the
  // parent's state always hears about it, or the next open would be a no-op.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.addEventListener('close', onClose);
    return () => dialog.removeEventListener('close', onClose);
  }, [onClose]);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState('copied');
    } catch {
      // Clipboard access can be denied (permissions, insecure origin). Select
      // the text so a manual copy is one keystroke away, and say so.
      textRef.current?.focus();
      textRef.current?.select();
      setCopyState('manual');
    }
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyState('idle'), 2400);
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
      aria-labelledby="prompt-editor-title"
      className="m-auto w-[min(44rem,calc(100vw-2rem))] rounded-xl border border-ink-700 bg-ink-900 p-0 text-ink-200 shadow-2xl backdrop:bg-black/60"
    >
      <div className="flex items-start gap-3 border-b border-ink-800 px-5 py-4">
        <div>
          <h2 id="prompt-editor-title" className="text-sm font-semibold text-white">Agent prompt</h2>
          <p className="mt-0.5 text-xs text-ink-400">
            Built from the issues currently shown. Edit it, then copy it into your coding agent.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="ml-auto rounded-md p-1 text-ink-400 transition hover:bg-ink-800 hover:text-ink-200"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <div className="px-5 py-4">
        <textarea
          ref={textRef}
          value={value}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); copy(); } }}
          spellCheck={false}
          aria-label="Agent prompt"
          className="h-[min(26rem,55vh)] w-full resize-y rounded-lg border border-ink-700 bg-ink-950 px-3 py-2.5 font-mono text-xs leading-relaxed text-ink-200 focus:border-emerald-400/60 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-ink-800 px-5 py-3">
        <span className="text-xs tabular-nums text-ink-600">{value.length.toLocaleString()} characters</span>
        {edited && (
          <button
            type="button"
            onClick={() => onDraftChange(null)}
            className="rounded-md px-2 py-1 text-xs font-medium text-ink-400 transition hover:text-ink-200"
          >
            Reset to generated
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-ink-400 transition hover:text-ink-200"
          >
            Close
          </button>
          <button
            type="button"
            onClick={copy}
            disabled={!value.trim()}
            aria-live="polite"
            className="rounded-md bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-ink-950 transition hover:bg-emerald-300 disabled:opacity-50"
          >
            {copyState === 'copied' ? 'Copied' : copyState === 'manual' ? `Press ${MOD_KEY}C to copy` : 'Copy prompt'}
            {copyState === 'idle' && <kbd className="ml-2 font-sans text-[10px] font-medium opacity-60">{MOD_KEY}↵</kbd>}
          </button>
        </div>
      </div>
    </dialog>
  );
}
