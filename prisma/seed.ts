import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth/password'

const db = new PrismaClient()

async function main() {
  const username = process.env.SEED_USERNAME?.trim().toLowerCase()
  const password = process.env.SEED_PASSWORD
  if (!username || !password || password.length < 12) throw new Error('SEED_USERNAME and a SEED_PASSWORD of at least 12 characters are required.')
  await db.user.upsert({
    where: { username },
    create: { username, passwordHash: await hashPassword(password), displayName: process.env.SEED_DISPLAY_NAME?.trim() || null },
    update: { passwordHash: await hashPassword(password), displayName: process.env.SEED_DISPLAY_NAME?.trim() || null },
  })
  console.log(`Seeded login for ${username}.`)
}

main().finally(() => db.$disconnect())
