# Parlez Delivery Backlog

This is the current source of truth for implementation status. A checked item means the behavior exists and has been verified in the present Next.js codebase—not merely that a screen or placeholder exists.

## Current baseline

- [x] Next.js 16 + React 19 + TypeScript application at the repository root
- [x] Responsive desktop sidebar and mobile navigation shell
- [x] Dexie schema for sentences, stories, cards, phrases, reading progress, speaking sessions, and user stats
- [x] Basic Web Speech API wrapper with normal/slow rates
- [x] Basic `ts-fsrs` scheduling wrapper and due-card updates
- [x] Seeded phrase-bank browsing/search/playback/review
- [x] One curated reader story with sentence translation, playback, spoken-form toggle, and card save/remove
- [x] MediaRecorder speaking capture, local playback, self-rating, and local history
- [x] Pure external-chat prompt generation and clipboard action
- [ ] Production-ready PWA or complete learning system

## P0 — Neon/Postgres backend migration (incremental)

Each item is intentionally small enough to implement and verify independently. Dexie remains the runtime source of truth throughout this sequence.

- [x] Add a Prisma/PostgreSQL server foundation, initial teaching-content migration, database health route, and hot-reloading Docker development stack.
- [ ] Provision the free-tier Neon project, apply the checked-in migration, and verify `/api/health/database` against Neon in a preview deployment.
- [x] Add seeded username/password authentication with scrypt hashes and opaque database-backed sessions; expose only the authenticated `userId` to server route handlers. No public signup flow exists yet.
- [ ] Define and validate a prepared teaching-content import format with source attribution and deterministic content-release versions.
- [ ] Import one prepared content release into PostgreSQL idempotently, without removing the current Dexie seed.
- [ ] Add a read-only, paginated content route that returns release/version metadata and typed story/sentence payloads.
- [ ] Add Dexie content-cache metadata and cache-ahead fetching while preserving offline reads and the existing Reader behavior.
- [ ] Switch Reader selection to cached remote content only after offline/cache tests pass; retain a bundled fallback.
- [x] Design the remote learner-state schema with stable IDs, `userId`, server timestamps, tombstones, device IDs, and an append-only server change sequence.
- [ ] Add Dexie `syncOutbox` and `syncMetadata` tables in a versioned local migration; local mutations must commit before enqueueing background work.
- [x] Implement an authenticated, transactional, idempotent `POST /api/sync/push` route and exclude recording blobs.
- [x] Implement an authenticated `GET /api/sync/pull?after=<cursor>` route using the server change sequence rather than client clocks.
- [ ] Define and test conflict rules, tombstone retention, retry/backoff, clock skew, concurrent-device edits, and offline recovery.
- [ ] Add a typed `learner_events` schema and local-first event capture for real learning actions; do not invent or backfill metrics.
- [ ] Build honest derived metrics and adaptive selection only after sufficient learner-event data and tests exist.

## P0 — restore learning correctness and honest UI

- [ ] Fix sentence review to be genuinely audio-first: do not display the full French answer before reveal, and implement the specified target-word/phrase cloze behavior.
- [ ] Keep phrase cards out of sentence review (or resolve them through a shared typed review-content abstraction) so queue rows cannot silently have missing content.
- [ ] Make reading resurfacing honor `nextResurfaceAt` and the documented listen-only/reread sequence.
- [ ] Remove avoidable `any` usage from reading-progress updates and validate all persisted date/status conversions.
- [ ] Add inline error/recovery states for IndexedDB, speech, clipboard, and microphone failures; replace `alert()` completion feedback.

## P0 — remove hard-coded frontend content and mock state

- [ ] Inventory every user-visible literal in `app/` and `components/`, classifying it as UI copy, bundled learning content, configuration, derived learner state, or obsolete mock data.
- [ ] Remove the hard-coded header date and generate locale-aware dates only where a date provides real value.
- [ ] Remove the hard-coded user name, avatar initial, level, streak, and profile details from `AppShell`; derive them from local settings/stats or show a neutral single-user state.
- [ ] Replace hard-coded home-page XP, streak history, lesson progress, remaining lessons, review counts, activity durations, level, and featured-story details with real IndexedDB queries and derived selectors.
- [ ] Replace the static `/progress` statistics, weekly chart, CEFR level, and motivational assessment with calculated learner events and honest empty states.
- [ ] Replace or remove the static `/learn` chapter, lesson list, completion state, locks, and progress percentage until a real learning-path/session model exists.
- [ ] Move reader stories, speaking scenarios, phrase categories, scenario categories, and other learning content out of route components into typed, validated content/configuration modules or prepared data assets.
- [ ] Keep stable interface labels in components, but centralize repeated product copy and configurable labels instead of duplicating them across routes.
- [ ] Remove placeholder controls and claims that have no behavior, including Settings, Add phrase, fake goals, fake time estimates, and unsupported progress promises; alternatively implement and test the behavior.
- [ ] Remove scaffold metadata and placeholder branding/assets that are not part of Parlez.
- [ ] Add tests proving dashboard, navigation, review counts, progress, and handoff selections respond to IndexedDB changes and do not fall back to fabricated learner data.

## P0 — make the promised content available

- [ ] Add a reproducible `prepare-content` package script and document prerequisites/checksums or versions for corpus inputs.
- [ ] Harden content preparation: safe process execution, download validation, deterministic output, attribution/license metadata, and actionable failures.
- [ ] Import prepared sentence content into Dexie instead of seeding only three examples.
- [ ] Create coherent multi-sentence passages/stories; independent Tatoeba pairs alone do not satisfy the Reader specification.
- [ ] Apply curated register pairs to eligible content with reviewable transformations; do not assume blind string replacement is linguistically safe.
- [ ] Implement local definition/meaning lookup and sentence-level mining from Reader interactions.
- [ ] Add sentence looping and reliable play/stop/lifecycle controls.

## P0 — verification foundation

- [x] Add a real ESLint command; rename or split the current TypeScript-only `lint` script.
- [ ] Add unit tests for FSRS mapping/grading, due-queue boundaries, seeding idempotency, prompt templating, difficulty scoring, and resurfacing dates.
- [ ] Add IndexedDB integration tests for saving/removing cards and sentence/phrase queue isolation.
- [ ] Add browser tests for the core loop: read → mine → review → grade → progress update.
- [ ] Establish CI for typecheck, lint, tests, and production build.
- [ ] Remove dual npm/pnpm lockfile ambiguity and document the chosen package manager.

## P1 — complete the feature specification

- [ ] Track reader lookups, listening time, review outcomes, and self-reported passage difficulty.
- [ ] Implement an adaptive content selector using documented, testable thresholds and recent learner signals.
- [ ] Derive words/phrases known, review accuracy, passages completed, listening minutes, speaking sessions, and a transparent CEFR estimate.
- [ ] Rebuild `/progress` from those derived metrics with honest empty states and no fake gamification.
- [ ] Replace the static `/learn` roadmap with an actual session orchestrator, or remove it from the primary path until it has real behavior.
- [ ] Expand Speaking from sentence repetition to timed scenario responses with reference comparison and compatible recording formats.
- [ ] Select handoff phrases from genuinely recent mined/reviewed items rather than the first six seed rows.
- [ ] Add the small static grammar-pattern reference and evidence-based inline surfacing described in `app-features.md`.
- [ ] Put Phrase Bank and Reader in a deliberate navigation/information architecture.

## P1 — offline and optional sync

- [ ] Add a web app manifest, suitable icons, installability metadata, and a service worker compatible with Next.js.
- [ ] Define what is precached versus runtime-cached, including prepared content size limits.
- [ ] Verify the complete core loop in airplane mode after first load and after app restart.
- [ ] Define sync metadata (`updatedAt`, tombstones, device/client ID, sync cursor) and migration strategy before choosing a provider.
- [ ] Implement optional free-tier sync with local writes always succeeding first and recording blobs excluded.
- [ ] Test first sync, concurrent edits, deletion, clock skew, retry/backoff, offline recovery, and quota/auth failures.

## P1 — accessibility, privacy, and browser support

- [ ] Run keyboard and screen-reader audits across every route; correct semantics, focus order, announcements, and modal/menu behavior.
- [ ] Meet 44×44px touch targets and WCAG AA contrast; add reduced-motion behavior.
- [ ] Test SpeechSynthesis voice loading, MediaRecorder MIME support, IndexedDB persistence, and clipboard behavior in current Chrome, Safari, Firefox, iOS, and Android targets.
- [ ] Document learner-data retention/export/reset behavior, especially local audio blobs.
- [ ] Decide whether Vercel Analytics is appropriate for a personal local-first app; document or remove it.

## P2 — maintainability and visual polish

- [ ] Extract shared sentence/phrase review behavior without erasing their pedagogical differences.
- [ ] Move cohesive data operations out of route components into typed domain/data services.
- [ ] Break up the monolithic global stylesheet and consolidate literal colors into the semantic design tokens in `DESIGN.md`.
- [ ] Load the declared fonts or deliberately choose system fonts and update the tokens.
- [ ] Add consistent loading, empty, error, permission, success, and offline components.
- [ ] Review final metadata and provide production application icons after placeholder/scaffold content has been removed in P0.
- [ ] Measure bundle/content size and page performance before shipping the corpus.

## Definition of done for v1

- [ ] The core loop is useful with a meaningful content set and remains functional offline.
- [ ] Review behavior matches the sentence-level, audio-first learning specification.
- [ ] All displayed learner metrics come from real local events and explain how they are calculated.
- [ ] Typecheck, lint, automated tests, production build, accessibility checks, and supported-browser smoke tests pass.
- [ ] Sync is either verified as optional and resilient or explicitly deferred without misleading UI/documentation.
- [ ] No runtime AI call, paid dependency, isolated-word learning feature, or cached/pre-recorded audio has been introduced.
