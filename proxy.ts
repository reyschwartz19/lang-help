import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { getDatabase } from '@/data/server/database'
const SESSION_COOKIE = 'parlez_session'

export async function proxy(request: NextRequest) {
  const db = getDatabase()
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const session = token ? await db.session.findUnique({ where: { tokenHash: createHash('sha256').update(token).digest('hex') }, select: { expiresAt: true } }) : null
  const loggedIn = Boolean(session && session.expiresAt > new Date())
  if (!loggedIn && request.nextUrl.pathname !== '/login') return NextResponse.redirect(new URL('/login', request.url))
  if (loggedIn && request.nextUrl.pathname === '/login') return NextResponse.redirect(new URL('/', request.url))
  return NextResponse.next()
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] }
