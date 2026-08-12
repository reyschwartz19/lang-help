import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

async function bytes(path) {
  let total = 0
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const target = join(path, entry.name)
    total += entry.isDirectory() ? await bytes(target) : (await stat(target)).size
  }
  return total
}

for (const directory of ['data/content', 'public', '.next/static']) {
  try { console.log(`${directory}: ${(await bytes(directory) / 1024).toFixed(1)} KiB`) }
  catch { console.error(`${directory}: unavailable (run npm run build first for .next/static)`); process.exitCode = 1 }
}
