# Parlez

Parlez is a personal, single-user French-learning web app focused on comprehensible input, sentence-level spaced repetition, conversational chunks, and self-assessed speaking practice.

The repository currently contains a functional browser prototype, not a production-ready PWA. Several core learning flows use IndexedDB and work locally after their seed data has loaded, while the dashboard, learning path, content pipeline integration, offline installation, adaptive difficulty, and sync remain incomplete.

## Current stack

- Next.js 16 App Router, React 19, and TypeScript
- Tailwind CSS 4 plus a shared global component-style layer
- Dexie 4 / IndexedDB for local learner data
- Prisma 6 with PostgreSQL for the server-only teaching-content foundation (local Docker or Neon)
- `ts-fsrs` for review scheduling
- Web Speech API for French text-to-speech
- MediaRecorder for local speaking recordings
- Vercel Analytics in production

The Next.js application and engineering documentation both live at the repository root.

## Repository map

```text
.
├── app-features.md              Product vision and intended learning modules
├── app-resources-and-apis.md    Approved resources and current usage status
├── app-system-design.md         As-built architecture plus target boundaries
├── DESIGN.md                    Design system represented by the current UI
├── TASKS.md                     Prioritized quality and delivery backlog
├── app/                         Next.js routes and global styling
├── components/                  Layout components and reusable UI primitives
├── data/                        Bundled content plus local/server data access
├── lib/                         Domain logic grouped by audio, handoff, and review
├── scripts/content/             Offline content-preparation tools
└── public/                      Static images and icons
```

## Routes

| Route | Current state |
|---|---|
| `/` | Polished shell with hard-coded progress and activity summaries |
| `/learn` | Static learning-path mockup; links the next item to Reader |
| `/reader` | One seeded three-sentence story, speech playback, translation, spoken-form toggle, card saving, and basic resurfacing transitions |
| `/review` | Due-card lookup and FSRS grading for saved sentence cards |
| `/phrases` | Seeded phrase browsing, search, playback, and phrase-card review; not linked in primary navigation |
| `/speaking` | Five static prompts, recording/playback, self-rating, and local session history |
| `/handoff` | Locally generated prompt with scenario selection and clipboard copy |
| `/progress` | Static demonstration data only |

## Run locally

```bash
npm install
npm run dev
```

Validation commands:

```bash
npm run lint
npm run build
```

Run `npm run typecheck` separately when you only need TypeScript validation.

### Docker development

The development stack runs Next.js and PostgreSQL with source bind-mounted into the web container. Start it once with:

```bash
docker compose up --build
```

Next.js hot reloads ordinary source changes without rebuilding the image. Rebuild only after changing `package.json`, `package-lock.json`, or `Dockerfile.dev`. PostgreSQL data, container dependencies, and the Next.js cache use named volumes.

The web container applies checked-in migrations on startup. To run the app on the host instead, copy `.env.example` to `.env.local`, start only PostgreSQL with `docker compose up postgres`, then run `npm run db:deploy` and `npm run dev` from the repository root.

If a default port is already in use, override it, for example `POSTGRES_PORT=5433 APP_PORT=3001 docker compose up --build`. Change the host-run `DATABASE_URL` port to match `POSTGRES_PORT`; container-to-container connections continue using port 5432.

`DATABASE_URL` is server-only. Use the local URL from `.env.example` for Docker-backed development and a Neon PostgreSQL URL only in server/deployment environment settings. Never prefix it with `NEXT_PUBLIC_`.

## Product constraints

- No AI or LLM network calls in the app. The handoff feature only creates text to copy into an external chat.
- No paid runtime services.
- Learner state is local-first in Dexie. A future sync service must remain optional and must never be required for the core loop.
- Audio is synthesized or recorded live in the browser; no pre-generated audio library or CDN.
- Learning and review content stays at sentence level rather than becoming isolated vocabulary lists.

## Documentation guide

- [app-features.md](app-features.md) describes the intended product. It is a vision document, not proof that a feature is complete.
- [app-system-design.md](app-system-design.md) documents both the code that exists and the still-missing target architecture.
- [DESIGN.md](DESIGN.md) records the current visual tokens and UI conventions.
- [TASKS.md](TASKS.md) is the evidence-based backlog and current source of truth for delivery status.
- [app-resources-and-apis.md](app-resources-and-apis.md) records approved external resources and whether each one is actually wired in.

## Current quality assessment

The strongest implemented slice is the local prototype loop: seed a small curated dataset, read a sentence, save it, review it with FSRS, practise phrases, record speech, and generate an external-chat prompt. The project is behind the original specification in production readiness, content depth, learning correctness, measurement, and verification. See `TASKS.md` for the ordered remediation plan and `app-system-design.md` for detailed gaps.
