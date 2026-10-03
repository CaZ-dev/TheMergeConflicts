# Lens

**Gemma 4 looks at your screenshot and shows you what is wrong, where.**

Built for the Hacktoberfest Hack Day Hyderabad "Best Use of Gemma 4" challenge.

## The problem, in one sentence

Design and accessibility problems are obvious once someone points at them, and invisible until someone does.

Lens takes a screenshot of any interface, sends it to Gemma 4 through the Gemini API, and draws numbered boxes directly on the image showing each issue, what is wrong, and the one-line fix.

## Why Gemma 4 is the product, not a garnish

Gemma 4 does not just describe the screenshot. It returns a structured audit where every finding carries a bounding box, and the app renders those coordinates as an overlay. A correctly placed box is visible proof the model is reasoning about the pixels rather than guessing from a prompt. Remove Gemma and there is no product left, only an empty canvas.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173 and click **Load sample screenshot**. That path needs no API key.

For live audits, add a key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey):

```bash
cp .env.example .env
# put your key in GEMINI_API_KEY, then restart the dev server
```

Then drop, paste, or browse to any screenshot.

## The 30-second demo

1. Open `http://localhost:5173/?demo=1`. The cached sample loads straight away.
2. Say the problem in one sentence while it renders.
3. Point at box 1. The destructive "Delete all" button is the loudest control on the page while "Save" is a ghost. Gemma found that by looking at relative visual weight, which no linter can do.
4. Hover a card in the list. Its box lights up and the rest dim.
5. Paste a judge's own screenshot. This is the live moment.
6. Click **Copy fixes as agent prompt** and show that the output is ready to paste into a coding agent.

**Fallback:** if the network or the API is down, `?demo=1` runs entirely offline. The badge in the toolbar always says whether a result is live or cached, so the cached run is never passed off as a live one.

## How it works

```
screenshot -> downscale to 1536px -> Gemma 4 (inline base64) -> JSON audit -> overlay + fixes
```

| File | Role |
| --- | --- |
| `server/prompt.js` | System instruction and the JSON contract. Prompt tuning is a one-file edit. |
| `server/audit.js` | Gemini API call, tolerant JSON extraction, one repair retry. |
| `shared/normalize.js` | Validates and clamps every box. Used by both the live and cached paths. |
| `vite.config.js` | Serves `POST /api/audit` from the dev server so there is only one process. |
| `src/components/Overlay.jsx` | The boxes. |

Three decisions worth knowing about.

**Boxes are percentage-positioned divs, not canvas strokes.** Gemma returns `box_2d` as `[ymin, xmin, ymax, xmax]` normalized to 0-1000, so dividing by 10 gives a CSS percentage directly. There is no scaling math, alignment survives any window size, and each box is a real focusable button with an accessible name.

**The JSON contract is prompted, not enforced.** Gemma on the Gemini API has no documented `responseSchema`, so `extractJson` strips code fences, slices to the outermost braces, and retries once asking for clean JSON before giving up with a readable error.

**A bad box degrades, it does not crash.** Any box that is malformed, inverted, or degenerate is dropped while the issue stays in the list marked "no region". A coordinate miss costs one rectangle, never the demo.

## Model

Defaults to `gemma-4-26b-a4b-it`, the sparse mixture-of-experts variant, because latency is visible in a live demo. Override with `GEMMA_MODEL` in `.env`; `gemma-4-31b-it` is stronger and slower.

## Note on the sample

`public/sample-screenshot.png` is a dashboard built deliberately to contain the seven defects it is cited for. `src/fixtures/sample-audit.json` is a hand-authored response matching it, used so the demo works before a key exists. The UI labels it **Cached sample response** whenever it is showing.
