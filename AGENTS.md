# AGENTS.md

Instructions for any AI coding tool working in this repo (Copilot agent mode, Cursor, OpenCode, Claude Code, etc). Read this before making changes.

## What this project is

A personal, single-user French learning PWA. Full context lives in these files, read the relevant one before working on a related task:
- `FEATURES.md` — what each module does and why
- `app-system-design.md` — architecture, data model, algorithms, folder structure
- `DESIGN.md` — visual design tokens, follow exactly, do not invent new colors/fonts/spacing
- `app-resources-and-apis.md` — every external resource/library in use and why
- `TASKS.md` — current build checklist, work through it in order unless told otherwise

## Hard rules

- No AI/LLM API calls anywhere in `src/`. The app has zero runtime AI dependency by design. The only AI usage is the user manually pasting a generated prompt into ChatGPT outside the app, that logic is pure string templating in `lib/promptTemplate.ts`, never a network call.
- No paid services. Everything must run on free tiers indefinitely (Supabase free tier, Vercel/Cloudflare free tier). Flag it explicitly if a task seems to require something paid, don't silently add it.
- Dexie/IndexedDB is the source of truth for app data. Supabase is sync-only. The app must be fully functional offline.
- Audio is generated live via the Web Speech API. Never add pre-recorded/cached audio files or an audio CDN.
- Follow `DESIGN.md` tokens exactly for every UI surface. If a component doesn't fit the existing tokens, that's a signal to revisit DESIGN.md, not to introduce a one-off color or font.
- Sentence-level content only. Never build a feature around isolated word lists, this violates the core learning approach the app is built on.

## Conventions

- React functional components + hooks, TypeScript throughout, no `any` unless genuinely unavoidable.
- Tailwind for all styling, no CSS-in-JS, no separate stylesheets except the Tailwind config itself.
- One module per folder under `src/modules/`, matching the structure in `app-system-design.md`. Keep modules self-contained, shared logic goes in `src/lib/`.
- Small, focused changes. Complete one `TASKS.md` item at a time, don't sprawl across unrelated modules in one pass.
- Run `npm run build` and `npm run lint` before considering a task finished, fix errors before moving on.
- Comment sparingly, only where the "why" isn't obvious from the code itself.

## When something is ambiguous

Check `FEATURES.md` and `app-system-design.md` first, they were written to cover exactly this kind of decision. If it's still genuinely unclear, make the smallest reasonable choice and leave a short `// TODO:` note explaining the open question, rather than guessing silently or blocking.
