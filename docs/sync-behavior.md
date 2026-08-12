# Local-first sync behavior

Local cards and reading progress commit in the same Dexie transaction as their outbox mutation. Network work happens afterward and never gates the local write. Mutations carry stable IDs, device identity, an acknowledged server cursor, and opaque mutation IDs.

The server accepts a mutation only when its base cursor is not older than the stored record; a concurrent newer server change wins and is returned on pull. Deletes are tombstones. Server sequence numbers—not device clocks—order changes. Recording blobs are excluded.

Retry delay is exponential (`2^attempts` seconds, capped at five minutes) with a fresh online retry. Failed items remain in the outbox. Pull applies server changes before advancing the cursor. Tests must cover duplicate mutation IDs, stale cursors, deletion, skewed device clocks, concurrent devices, retry, and offline recovery before remote sync is enabled by default. Tombstones should be retained for at least 90 days and only purged after every active device cursor has passed them.
