# Parlez System Design

This document separates the as-built system from the intended production architecture. Paths and claims below reflect the repository as of August 2026.

## 1. As-built architecture

```text
Next.js 16 App Router (`app/`)
        │
        ├── route-level client components
        ├── shared AppShell / global CSS
        ├── browser APIs
        │     ├── SpeechSynthesis
        │     ├── MediaRecorder / getUserMedia
        │     └── Clipboard
        └── Dexie 4 (`parlez` IndexedDB)
              ├── three curated reader sentences + one story
              ├── bundled phrase-bank seed
              ├── review scheduling state
              ├── reading progress
              └── local recording blobs

Build-time-only script (manual, not in package scripts):
Tatoeba + Lexique downloads → intended `data/content/sentences.json`
```

There is now a server-only PostgreSQL foundation and a user-scoped learner-state sync schema, but no content API consumed by the UI, authentication, sync engine, service worker, web manifest, or runtime AI integration. Vercel Analytics remains the only production-only network integration used by the browser application.

### Backend foundation

Prisma defines an initial teaching catalog (`content_releases`, `stories`, `sentences`, and ordered `story_sentences`). Next.js route handlers are the database boundary; `DATABASE_URL` is validated in a server-only module and must never be exposed as a public environment variable. `/api/health/database` verifies connectivity without returning connection details.

Local development uses PostgreSQL 16 and the Next.js dev server through Docker Compose. The frontend source is bind-mounted and Next.js hot reloads edits; named volumes retain database data, dependencies, and build cache. The same Prisma schema can target a free-tier Neon PostgreSQL database in deployment.

Authentication uses a seeded Neon user with a scrypt password hash and opaque database-backed sessions. The browser receives only a secure, HttpOnly session cookie; server routes derive `userId` from that session. The schema is multi-user-ready even though signup and account management are intentionally absent. Authenticated push/pull routes isolate learner records by `userId`, register devices, retain deletion tombstones, reject duplicate mutations, and expose an append-only server change sequence. Automatic Dexie outbox processing remains to be connected.

## 2. Code organization

```text
./
├── app/
│   ├── layout.tsx              Metadata, viewport, analytics
│   ├── globals.css             Tokens and most visual component styles
│   ├── page.tsx                Static-heavy home dashboard
│   ├── learn/page.tsx          Static learning-path mockup
│   ├── reader/page.tsx         Reader and card mining
│   ├── review/page.tsx         Sentence-card review
│   ├── phrases/page.tsx        Phrase browsing and review
│   ├── speaking/page.tsx       Recording and self-review
│   ├── handoff/page.tsx        External-chat prompt generation
│   └── progress/page.tsx       Static progress mockup
├── components/
│   ├── layout/app-shell.tsx    Shared navigation/layout
│   └── ui/button.tsx           Base UI button primitive
├── data/
│   ├── content/                Phrase and spoken-register JSON seeds
│   ├── local/
│   │   ├── database.ts         Dexie schema and TypeScript entities
│   │   └── seed-database.ts    Development-scale IndexedDB seed
│   └── server/
│       ├── database.ts         Server-only Prisma client
│       └── environment.ts      Server environment validation
├── lib/
│   ├── audio/speech-synthesis.ts       Browser speech wrapper
│   ├── handoff/prompt-template.ts      Pure string template
│   ├── review/fsrs-scheduler.ts        FSRS mapping, queue, grading
│   └── class-names.ts                  Shared class-name utility
└── scripts/content/prepare-sentence-corpus.ts
                                Offline corpus preparation
```

The earlier proposed `src/modules/` architecture was never adopted. Routes currently own most behavior directly. Future extraction should follow actual cohesion (review, reader, speaking, stats, sync) rather than moving files solely to match an old diagram.

## 3. Local data model

Dexie database name: `parlez`; schema version: `1`.

| Table | Primary key / indexes | Actual role |
|---|---|---|
| `sentences` | `id`; difficulty, CEFR, source | Static sentence content currently seeded with 3 curated rows |
| `stories` | `id`; difficulty | Ordered sentence-ID groups; currently one story |
| `cards` | `id`; sentence ID, type, due date | Sentence and phrase review state |
| `phraseBank` | `id`; category, card ID | Bundled conversational chunks and their card links |
| `readingProgress` | `storyId`; status, next resurfacing | Story state transitions |
| `speakingSessions` | `id`; scenario, completion date | Local recording blobs and optional self-rating |
| `userStats` | `id` | Defined but not populated or derived |

`Card.sentenceId` is polymorphic: it points to `sentences.id` for sentence cards and `phraseBank.id` for phrase cards. This works in the current queries but has no referential enforcement. FSRS state is stored as a reduced projection and reconstructed heuristically; review logs and several FSRS fields are discarded.

## 4. Implemented flows

### Reader

`ensureSeeded()` inserts one curated story when sentences are absent. Reader selects the first non-mastered progress row, reads sentences in story order, synthesizes speech, reveals a sentence translation, toggles a curated spoken form, and creates/deletes a sentence card. Completion advances `unread → listen_only_due → reread_due → mastered` with 1-day and 3-day delays.

Current limitations: selection does not enforce `nextResurfaceAt`; the final mastered transition keeps a meaningless next date; only one tiny story exists; no word/phrase definition lookup exists; no sentence loop exists; and status casting uses `any`.

### Review and Phrase Bank

Due cards are filtered in memory and graded through `ts-fsrs`. Phrase cards are created for the full seed bank. Sentence and phrase screens duplicate much of their review UI.

Current limitations: the front of a supposed audio-first card displays the complete French answer; no target segment is silenced; phrase cards appear in the general review query but cannot join to `sentences`, producing null rows; statistics/review logs are not retained; and automated scheduler tests are absent.

### Speaking

Five in-code prompts support browser recording, immediate playback, local persistence, replay, and optional self-rating.

Current limitations: this is repetition of a supplied sentence rather than an open scenario response under countdown pressure; compatibility/MIME handling is minimal; blobs have no retention policy; and no aggregate session metrics are produced.

### Handoff

A pure template combines a selected scenario, a CEFR fallback, and the first six phrase-bank rows, then copies the prompt to the clipboard.

Current limitations: items are not recent, mined, or performance-selected; `userStats` is normally empty; and clipboard fallback/error UI is incomplete.

### Home, Learn, and Progress

These routes are presentational prototypes. Streaks, dates, lesson state, XP, review counts, weekly activity, word counts, and CEFR level are hard-coded and can conflict with IndexedDB.

## 5. Content pipeline

`scripts/content/prepare-sentence-corpus.ts` downloads French and English Tatoeba exports, their links, and Lexique 3.83; scores up to 10,000 pairs; and writes `data/content/sentences.json`.

It is not integrated into the current app:

- there is no `prepare-content` package script;
- `sentences.json` is not present in the repository;
- `seed.ts` does not import generated sentences;
- stories are not generated from independent sentence pairs;
- register pairs are bundled but not applied by the pipeline;
- attribution/license output is not produced;
- downloads and shell interpolation lack robustness and reproducibility controls.

The corpus pipeline should remain a build/development tool. Runtime must consume prepared, attributable static assets without contacting content providers.

## 6. Target production boundaries

The intended architecture remains local-first:

```text
Prepared static content ──► browser application ──► Dexie (source of truth)
                                      │
                                      ├── browser speech/recording APIs
                                      ├── service worker + app manifest
                                      └── optional background sync
                                                   │
                                                   ▼
                                          free-tier sync store
```

Required invariants:

- Core reading, review, phrase, speaking, and progress flows work without a network after installation.
- An optional sync layer mirrors learner-generated state, not static corpora or recording blobs.
- Sync failure never blocks local writes.
- Every mutable synced record needs stable identity, `updatedAt`, deletion semantics, and deterministic conflict handling.
- No AI/LLM endpoint is called by application code.
- No paid service becomes required for normal use.

Neon is the selected remote PostgreSQL target. Its free-tier limits and terms must be rechecked before deployment; local development does not depend on Neon availability.

Future synchronization must use a server-issued monotonically increasing change cursor and explicit deletion tombstones. The older timestamp-only last-write-wins proposal is insufficient because client clocks can differ and deletions could otherwise be resurrected.

## 7. Quality gap against the product specification

| Area | Intended level | Current evidence | Gap |
|---|---|---|---|
| Offline/PWA | Installable and fully offline | No manifest or service worker | Critical |
| Content | Leveled corpus and multiple passages | 3 curated sentences, 1 story | Critical |
| Review pedagogy | Audio-first cloze recall | Full French sentence is visible | Critical |
| Adaptive engine | Lookup/review-driven difficulty | No tracking or selection algorithm | Critical |
| Progress | Derived, honest learner metrics | Static screens; unused stats table | High |
| Sync | Optional cross-device background sync | Not implemented | High |
| Reader | Definitions, looping, scheduled resurfacing | Translation-only and partial state transitions | High |
| Testing | Regression coverage for data/algorithms/flows | No project tests | High |
| Accessibility | Keyboard, screen reader, reduced motion, robust states | Some labels/focus styling; no audit | High |
| Type safety | Strict TypeScript without avoidable escapes | At least one status `any`; weak cross-entity model | Medium |
| Maintainability | Cohesive reusable modules | Large route components and duplicated review UI | Medium |
| Observability/privacy | Explicit data/network policy | Analytics enabled without documented consent/privacy position | Medium |

`TASKS.md` converts this assessment into an ordered remediation backlog.
