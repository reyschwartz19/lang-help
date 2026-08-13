import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('production service worker caches visited navigations and ignores API traffic', async () => {
  const source = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8')
  assert.match(source, /request\.mode === 'navigate'/)
  assert.match(source, /networkFirst\(request\)/)
  assert.match(source, /url\.pathname\.startsWith\('\/api\/'\)/)
  assert.match(source, /cache\.put\(request, response\.clone\(\)\)/)
})
