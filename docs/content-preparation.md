# Content preparation

Run `npm run prepare-content` only when rebuilding the optional Tatoeba/Lexique sentence-pair corpus. Runtime content never downloads from these services.

Prerequisites: Node 22, `curl`, `bzip2`, and `tar`. Inputs are the current Tatoeba French/English per-language exports and links export plus Lexique 3.83. Downloads use fail-on-HTTP-error and retry behavior, and empty archives are rejected. Because the upstream rolling Tatoeba exports do not publish immutable versioned checksums, archive the downloaded files under `data/raw/` and record SHA-256 checksums before approving a release; do not present rolling output as reproducible.

The reviewed runtime release is `data/content/content-release.json`. It has a deterministic `YYYY.MM.N` version, attribution/license metadata, coherent stories, stable IDs, and validation at import/cache boundaries. Import it into local PostgreSQL with `npm run content:import`; the transaction is idempotent. Neon deployment/import remains deferred until final project migration.

Curated register forms are stored only after human review in the prepared release. The corpus script does not apply blind replacements.
