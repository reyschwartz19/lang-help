# Privacy, retention, accessibility, and browser support

All learner state is kept in IndexedDB. Speaking recordings remain local and are excluded from sync and service-worker caches. They are retained until the learner resets site data; a dedicated export/reset control is still required before release. Browser site-data controls can export neither audio nor structured state, so this limitation must be presented honestly.

Optional sync always commits locally first. Stable record IDs, `updatedAt` payload fields, deletion tombstones, a persistent device ID, and a server-issued cursor are defined in the local and Prisma schemas. The local engine retries with capped exponential backoff and tolerates offline/auth/quota failures without blocking learning. Neon provisioning and production migration are deferred until project completion.

Vercel Analytics is not included: personal learning history should not leave the device merely for traffic analytics.

Supported smoke-test targets are current Chrome, Firefox, and Safari desktop; Chrome Android; and Safari iOS. Audit each route by keyboard and a screen reader. Verify delayed SpeechSynthesis voice loading, a supported MediaRecorder MIME type, persistent IndexedDB after restart, clipboard success and manual-copy recovery, microphone denial, 200% zoom, reduced motion, focus order, and 44×44 px targets. Automated tests cannot certify OS voices, permissions, persistence eviction, or screen-reader output, so these remain a release checklist.
