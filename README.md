# Handball — Video Analysis UI

A small, client-first React app where a coach uploads a handball video and receives coach-style feedback plus 2–3 recommended exercises. Analysis is simulated locally by default; optionally, you can enable real AI feedback via a secure Netlify Function that uses the Gemini API key stored in server-side environment variables.

## Stack & Rationale
- React 19 + TypeScript 5.8 + Vite 7: modern, fast DX, type safety, small bundles.
- Tailwind CSS 4: utility-first styling for a clean, responsive UI with minimal CSS overhead.
- Client-first simulation: fast, private by default; no uploads in the default mode.
- Netlify Functions (optional): safe server-side path for Gemini API calls without exposing secrets to the browser.
- ESLint: enforces code quality and consistent standards.

## Architecture Overview
```
src/
  components/         # UI building blocks
    UploadArea.tsx        # File input + drag & drop, validation, thumbnail
    AnalysisProgress.tsx  # Spinner + microcopy
    FeedbackResult.tsx    # Renders Markdown and exercise cards
    ExerciseCard.tsx      # Single exercise card (title, thumbnail, link)
    Layout.tsx            # Header/brand shell
  pages/
    AnalyzePanel.tsx      # Page-level container managing state
  services/
    analyzeVideo.ts       # Orchestrates analysis (local + optional Gemini)
    exerciseSelect.ts     # COMPASS_SEARCH (simulated) selection logic
    gemini.ts             # Client helper to call Netlify Function
  data/
    exercises.ts          # Small curated dataset
  types/                  # Typed contracts
netlify/
  functions/analyze.ts    # Serverless function calling Gemini securely
netlify.toml              # Functions directory config
```

### Key Logic
- UploadArea
  - Validates MP4/MOV, size limit, drag & drop, generates a local thumbnail via `<video>` + `<canvas>`.
- AnalyzePanel
  - States: idle → analyzing → done/error. On select, calls `analyzeVideo(file)`.
- analyzeVideo
  - Detects skill tags from filename (e.g., passing, footwork) or, if enabled, from Gemini response.
  - Builds Markdown feedback with consistent structure (What’s good / What to improve).
  - Selects exercises via `selectExercises(tags, level, count, focusArea)`.
- exerciseSelect (COMPASS_SEARCH simulated)
  - Scores by tag overlap (primary), focus-area match (bonus), and level closeness (secondary), then encourages tag diversity.
- FeedbackResult
  - Renders Markdown with styled sections and an exercise grid. YouTube links auto-derive thumbnails.
- Netlify Function `analyze.ts`
  - Accepts preview frames from the client, calls Gemini with server-held `GEMINI_API_KEY`, returns a minimal JSON shape to the client.

## Security & Privacy
- Default mode keeps all analysis local (no upload). No key in the client.
- When enabling real AI analysis, the browser sends only a few preview frames to `/.netlify/functions/analyze`.
- The Gemini API key is stored only in Netlify Functions env (`GEMINI_API_KEY`); it is never exposed in the client bundle.

## Running Locally
Prerequisites: Node 18+.

### Option A — Local, no Gemini (default, fully private)
1) Install
```
npm i
```
2) Start Vite
```
npm run dev
```
3) Open the URL shown by Vite. Upload a short MP4/MOV; you’ll get simulated feedback and exercises.

### Option B — Local with Gemini via Netlify Functions (secure)
1) Create `.env` at project root (gitignored):
```
GEMINI_API_KEY=your-secret
VITE_ALLOW_EXTERNAL_ANALYSIS=true
```
2) Install and run Netlify Dev (proxies functions):
```
npx netlify dev
```
Notes:
- On Windows PowerShell, you can set env vars per-session:
  - `$env:GEMINI_API_KEY='your-secret'; $env:VITE_ALLOW_EXTERNAL_ANALYSIS='true'; npx netlify dev`
- On Bash:
  - `GEMINI_API_KEY=your-secret VITE_ALLOW_EXTERNAL_ANALYSIS=true npx netlify dev`
- The client will call `/.netlify/functions/analyze`, and the server function reads `process.env.GEMINI_API_KEY`.

## Deploying to Netlify (safe mode)
1) Set environment variables in the site settings:
   - `GEMINI_API_KEY` (Functions scope) — required for real analysis
   - `VITE_ALLOW_EXTERNAL_ANALYSIS=true` — enables client to call the function
2) Ensure `netlify.toml` includes:
```
[functions]
  directory = "netlify/functions"
```
3) Deploy. The client calls the function; the key stays server-side per Netlify docs.

## Acceptance Criteria Covered
- Upload works with validation and optional drag & drop.
- Analyzing state (2–5s deterministic simulated delay with local mode).
- Feedback always includes positives, improvements, and 2–3 exercises.
- Exercise selection relevance and diversity with clear links.
- Clean, responsive, accessible UI; no console errors; build passes.

## Known Limitations
- No persistence or auth.
- Single-page flow; no routing.
- Gemini output is lightly parsed; the app enforces concise items.

## Scripts
- `npm run dev` — Vite dev server (local-only analysis)
- `npx netlify dev` — Vite + Netlify Functions (Gemini enabled when env is set)
- `npm run build` — Type-check + production build
- `npm run lint` — ESLint

