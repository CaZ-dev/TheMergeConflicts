import { useCallback, useEffect, useRef, useState } from 'react';

export default function DropZone({ onFile, onSample, notes, onNotesChange, busy }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  // Judges demo fastest by pasting. Listen globally so the page needs no focus.
  useEffect(() => {
    const onPaste = (e) => {
      const file = [...(e.clipboardData?.files ?? [])][0];
      if (file) onFile(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [onFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }, [onFile]);

  return (
    <div className="mx-auto w-full max-w-xl">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed px-8 py-14 text-center transition
          ${dragging ? 'border-emerald-400 bg-emerald-400/5' : 'border-ink-700 hover:border-ink-600 hover:bg-ink-900/60'}`}
      >
        <svg className="mx-auto h-9 w-9 text-ink-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="14" rx="2" />
          <path d="m3 14 4.5-4.5 4 4L15 10l6 5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none" />
        </svg>

        <p className="mt-4 text-sm font-medium text-ink-200">
          Drop a screenshot, paste from clipboard, or click to browse
        </p>
        <p className="mt-1 text-xs text-ink-400">PNG, JPEG, or WebP</p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
        />
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-medium text-ink-400">What should it focus on? (optional)</span>
        <input
          type="text"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder="e.g. this is the mobile checkout step"
          className="mt-1.5 w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-200 placeholder:text-ink-600 focus:border-emerald-400/60 focus:outline-none"
        />
      </label>

      <div className="mt-5 flex items-center justify-center gap-3">
        <span className="text-xs text-ink-600">No key yet?</span>
        <button
          type="button"
          onClick={onSample}
          disabled={busy}
          className="rounded-lg bg-ink-800 px-4 py-2 text-xs font-medium text-ink-200 ring-1 ring-inset ring-ink-700 transition hover:bg-ink-700 disabled:opacity-50"
        >
          Load sample screenshot
        </button>
      </div>
    </div>
  );
}
