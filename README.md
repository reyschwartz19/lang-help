# French Learning PWA

A personal, single-user app for going from A1-A2 French to real conversational ability, built around comprehensible input, sentence-level spaced repetition, and reflexive conversational chunks, not lessons or drills.

Full design and planning docs:
- `FEATURES.md` — every module, what it does, why it exists
- `app-system-design.md` — architecture, data model, algorithms
- `app-resources-and-apis.md` — every external resource/library used, all free
- `DESIGN.md` — visual design system, follow exactly
- `AGENTS.md` — rules for any AI coding tool working in this repo
- `TASKS.md` — the build checklist, current progress lives here

## Core principle

No AI runs inside the app. All content comes from open datasets (Tatoeba, Lexique), all audio is generated live in-browser (Web Speech API), and the only AI usage is a manually copy-pasted prompt for external conversation practice in ChatGPT. Everything else runs entirely on free tiers, indefinitely.

## Stack

React + TypeScript + Vite + Tailwind, Dexie (IndexedDB) as the local-first data store, Supabase free tier for cross-device sync only, ts-fsrs for spaced repetition scheduling, hosted free on Vercel or Cloudflare Pages.

## Getting started

```
npm install
npm run dev
```

Content must be prepared once before the app has anything to show:

```
npm run prepare-content
```

This runs `scripts/prepare-content.ts`, which ingests the Tatoeba and Lexique data and generates the static JSON the app reads from `src/data/content/`.

## Status

See `TASKS.md` for current build progress.
