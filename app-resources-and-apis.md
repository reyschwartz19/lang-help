# Resources, APIs & Data Sources
Everything the app needs, all free, no paid tier required anywhere.

---

## 1. Language Content (the actual French material)

### Tatoeba
- **What it is:** Open, community-built database of sentence pairs (French-English and many other language pairs), several hundred thousand for French, many human-verified, some with community audio.
- **Purpose:** Primary source of real sentence-level content for the reader and for auto-generated flashcards. Sentence-level (not word lists) matches the research directly.
- **Cost:** Free, open data (CC-BY license, attribution required).
- **Access:** Bulk CSV/TSV downloads at tatoeba.org/en/downloads, or their API for smaller queries.
- **Notes:** Download once, filter to A1-A2/A2-B1 complexity locally (by sentence length + word frequency, see Lexique below), store as static JSON/SQLite in the repo. No live API calls needed at runtime.

### OpenSubtitles Corpus (optional, secondary)
- **What it is:** Large corpus of real film/TV subtitles, useful for informal/spoken-register examples (contractions, slang, natural phrasing).
- **Purpose:** Source material for the spoken-vs-written register comparisons.
- **Cost:** Free for research/personal use.
- **Access:** OPUS (opus.nlpl.eu) hosts a cleaned, aligned French-English subtitle corpus, downloadable in bulk.
- **Notes:** Optional for v1 — needs more cleaning than Tatoeba. Can start with a small, manually curated set of common formal-to-spoken transformations instead (see System Design doc) and add this later if you want more coverage.

### Lexique 3.83
- **What it is:** Academic French word-frequency database (lemma frequency, part of speech, etc.), maintained by French cognitive science researchers.
- **Purpose:** Used to estimate a sentence's difficulty/CEFR level based on how common its words are, so content can be filtered/leveled without manual tagging.
- **Cost:** Free, open academic resource.
- **Access:** lexique.org, downloadable database file.

### CEFR vocabulary reference (A1/A2 word lists)
- **What it is:** Publicly available word lists mapped to CEFR levels (several free versions exist, e.g. from language-learning research projects and some open EU-funded resources).
- **Purpose:** Cross-check Lexique frequency data against actual CEFR-tagged vocabulary for more accurate leveling.
- **Cost:** Free.
- **Notes:** Not essential for v1 (Lexique frequency alone is a reasonable proxy), but improves leveling accuracy if you want to add it.

---

## 2. Audio

### Web Speech API (SpeechSynthesis)
- **What it is:** Built into every modern browser (Chrome, Edge, Safari), no install, no key.
- **Purpose:** Reads any French sentence aloud on demand, at normal or slowed rate.
- **Cost:** Free, unlimited, no signup.
- **Notes:** Quality is synthetic, not human, but it's zero-maintenance and generates audio live, so there's nothing to pre-record, store, or cache. This removes an entire storage/CDN layer other plans included.

### Web Speech API (SpeechRecognition) — optional
- **What it is:** Built-in browser speech-to-text.
- **Purpose:** Could transcribe your spoken practice responses for rough self-comparison. Not required, since the plan is self-record-and-compare rather than AI-graded.
- **Cost:** Free where supported.
- **Notes:** Support is inconsistent outside Chrome, treat as an optional nice-to-have, not a dependency.

### MediaRecorder API
- **What it is:** Built-in browser API for recording microphone audio.
- **Purpose:** Powers the scenario speaking drill (record your spoken response, play it back next to a reference).
- **Cost:** Free, built-in, no library needed.

---

## 3. Spaced Repetition

### ts-fsrs
- **What it is:** Open-source TypeScript implementation of FSRS (Free Spaced Repetition Scheduler), the modern successor to SM-2, used by current-generation tools like Anki.
- **Purpose:** Schedules when each sentence/phrase card comes up for review.
- **Cost:** Free, open source (npm package).
- **Link:** npmjs.com/package/ts-fsrs

---

## 4. Storage & Sync

### Dexie.js
- **What it is:** A friendly wrapper around the browser's built-in IndexedDB.
- **Purpose:** Local-first storage for all your data (mined sentences, review state, progress) directly on your device, works fully offline.
- **Cost:** Free, open source (npm package).

### Supabase (free tier)
- **What it is:** Hosted Postgres database + auth, generous free tier.
- **Purpose:** Thin sync layer only, so your phone and laptop stay in sync. Not the primary data store, Dexie is.
- **Cost:** Free tier (500MB database, more than enough for single-user text data).
- **Link:** supabase.com

---

## 5. Frontend & Build Tooling

| Tool | Purpose | Cost |
|---|---|---|
| React | UI framework | Free, open source |
| TypeScript | Type safety | Free, open source |
| Vite | Build tool / dev server | Free, open source |
| Tailwind CSS | Styling | Free, open source |
| vite-plugin-pwa | Turns the app into an installable, offline-capable PWA | Free, open source |

---

## 6. Hosting & Deployment

### Vercel or Cloudflare Pages
- **Purpose:** Hosts the built static app, free tier is more than enough for a single-user app.
- **Cost:** Free tier, no card required.

### GitHub
- **Purpose:** Version control and source of truth for the code, also connects to Vercel/Cloudflare for auto-deploy on push.
- **Cost:** Free for public/private repos at this scale.

---

## 7. External, manual-use only (not integrated into the app)

### ChatGPT (free tier)
- **Purpose:** Conversation practice sessions, using a prompt the app generates and you paste in manually.
- **Cost:** Free tier, used entirely outside the app, no API key, no integration, no cost to you or the app.

---

## 8. What's deliberately NOT included

- No paid AI API (OpenAI, Anthropic, Gemini) calls at runtime, anywhere.
- No pre-generated/cached audio files or CDN, Web Speech API generates audio live.
- No AI-based content generation, all content comes from Tatoeba/OpenSubtitles.
- No AI-based speech evaluation, the scenario drill is self-record-and-compare.

This keeps the entire running app at $0/month indefinitely, regardless of how much you use it, since nothing scales with usage except your own Supabase free-tier storage (which won't come close to its limit for single-user text data).
