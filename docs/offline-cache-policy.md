# Offline cache policy

Parlez remains local-first. Dexie stores teaching content and all learner state; the service worker stores only the application shell and same-origin GET responses. API responses, authentication, sync traffic, and recording blobs are never cached by the service worker.

The initial shell precaches the primary routes, manifest, and icons. Next.js assets encountered during use are runtime-cached. Prepared teaching content is imported into Dexie and capped by the content preparation release; it is not duplicated in Cache Storage. A release should remain below 25 MB before inclusion, and the build must report its size.

Airplane-mode verification: make a production build, start it, visit every primary route once, complete a read → mine → review cycle, go offline, reload, repeat the cycle, close/reopen the installed app, and verify the saved card, event metrics, audio synthesis availability, and speaking history. Speech voices are supplied by the operating system and must be tested separately.
