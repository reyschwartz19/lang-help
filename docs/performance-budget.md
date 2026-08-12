# Performance and content-size baseline

Measured locally from the production build on 2026-08-13. This is a pre-shipping baseline, not a claim about field performance.

## Budgets

- Bundled prepared learning content: target under 5 MB compressed; current checked-in `data/content` is 39.6 KiB.
- Install icons and public static assets: target under 500 KB; current `public` total is 28.8 KiB.
- Current production static output (`.next/static`) is 1,174.8 KiB across all framework, route, and CSS chunks.
- First-load JavaScript: flag any route above 250 KB compressed or unexplained growth above 20% from the saved baseline.
- Core routes should render useful loading/empty states without waiting for a network request; IndexedDB remains the runtime source of truth.

Run `npm run build` followed by `npm run measure`. Next.js build output is the canonical per-route bundle report. Browser Lighthouse measurements should be recorded on the eventual deployment because local development and preview hardware are not representative.
