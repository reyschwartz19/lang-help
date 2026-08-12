# Frontend literal inventory

Reviewed scope: `app/` and `components/`.

- UI copy: stable headings, control labels, instructions, error/recovery text, and empty states remain beside the interaction that owns them.
- Bundled learning content: stories/sentences live in `data/content/content-release.json`; phrase rows live in `data/content/phrase-bank.json`; speaking and handoff scenarios live in `data/content/scenarios.ts` and `lib/handoff/prompt-template.ts`.
- Configuration: navigation entries live in `components/layout/app-shell.tsx`; category presentation mapping remains in the Phrase Bank component because it is purely visual.
- Derived learner state: home and progress values query Dexie cards, reading progress, stories, and learner events. Review counts include sentence cards only.
- Removed mock/obsolete data: fixed 2025 date, Remy identity/avatar/level, streak, XP, lesson locks/progress, fake time estimates, static weekly chart, static CEFR assessment, Settings/Add phrase controls, featured story claim, scaffold generator metadata, analytics, and placeholder assets.

Stable interface labels are intentionally not treated as learning content. No user-visible learner metric may be added without a local persisted source and a documented selector.
