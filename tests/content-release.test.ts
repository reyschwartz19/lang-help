import assert from 'node:assert/strict'
import test from 'node:test'
import { bundledContentRelease, validateContentRelease } from '../lib/content/content-release'

test('bundled release is attributable, deterministic, and passage-based', () => {
  assert.match(bundledContentRelease.releaseVersion, /^\d{4}\.\d{2}\.\d+$/)
  assert.ok(bundledContentRelease.attribution.length > 0)
  assert.ok(bundledContentRelease.stories.every(({ sentences }) => sentences.length >= 2))
  assert.throws(() => validateContentRelease({ schemaVersion: 1, releaseVersion: 'latest' }))
})

