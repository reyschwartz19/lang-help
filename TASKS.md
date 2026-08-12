# TASKS.md

Build checklist, ordered. Each item is sized to be roughly one focused agent session, don't hand a tool more than one unchecked item at a time. Check items off as you go, this file is the source of truth for "where did I leave off."

## Phase 0: Scaffold (no AI needed, plain CLI)
- [ ] `npm create vite@latest` with React + TypeScript template
- [ ] Add Tailwind CSS, configure tokens from DESIGN.md in `tailwind.config.js`
- [ ] Add `vite-plugin-pwa`, basic manifest + icons
- [ ] Confirm it builds and deploys to Vercel/Cloudflare Pages from an empty shell
- [ ] Push initial commit, connect GitHub to hosting for auto-deploy

## Phase 1: Data foundation
- [x] `scripts/prepare-content.ts`: ingest Tatoeba bulk download, filter to French-English pairs
- [x] Ingest Lexique frequency data, write difficulty-scoring function
- [x] Score and bucket Tatoeba sentences into rough CEFR bands, output static JSON to `src/data/content/`
- [x] Build curated register-pair table (formal → spoken French), start with ~30-50 hand-picked common examples
- [x] Seed initial phrase bank JSON (greetings, buying time, repair, opinion categories)
- [x] Set up `src/data/db.ts`, Dexie schema matching the data model in app-system-design.md

## Phase 2: Reader module
- [x] Sentence/story display component using DESIGN.md type/layout rules
- [x] Web Speech API wrapper (`lib/audio.ts`), normal + slowed playback
- [x] Tap-to-define + tap-to-save-as-card interaction
- [x] Spoken-form toggle display where a register pair exists
- [x] Story resurfacing logic (read → listen-only → reread schedule)

## Phase 3: Review module
- [x] `lib/fsrs.ts` wrapper around ts-fsrs
- [x] Audio-first card component (hear silenced sentence, speak, reveal)
- [x] Review queue screen, self-grading, updates card state via FSRS

## Phase 4: Phrase Bank module
- [x] Phrase bank browsing/review screen, same review mechanic as Module 3, filtered to `type: "phrase"`

## Phase 5: Speaking Drill module
- [x] Scenario prompt display + MediaRecorder integration
- [x] Local playback of recording next to reference audio
- [x] Session log (no AI grading, self-assessed only)

## Phase 6: ChatGPT Handoff module
- [x] `lib/promptTemplate.ts`, pulls recent cards/phrases + CEFR estimate into the fixed template
- [x] "Copy prompt" UI, scenario category picker

## Phase 7: Difficulty engine
- [ ] Lookup-rate and review-accuracy tracking
- [ ] Adaptive difficulty adjustment logic, wired into what the Reader serves next

## Phase 8: Dashboard
- [ ] Aggregate stats screen (words/phrases known, accuracy, listening minutes, stories completed, CEFR estimate)

## Phase 9: Grammar reference
- [ ] Small static lookup table of common patterns
- [ ] Inline surfacing when a pattern repeats in reading content

## Phase 10: Sync
- [ ] Supabase project + schema (mirrors Dexie tables, excluding recording blobs)
- [ ] Background push/pull sync logic, last-write-wins by timestamp

## Phase 11: Polish
- [ ] Full offline test pass (airplane mode, confirm core loop works)
- [ ] Mobile responsive pass against DESIGN.md accessibility floor
- [ ] Real daily-use test run, note friction points here before considering v1 "done"
