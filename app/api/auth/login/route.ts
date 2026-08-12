import { NextResponse } from "next/server";
import { createHash } from 'node:crypto'
import { getDatabase } from "@/data/server/database";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { hasTrustedOrigin } from '@/lib/auth/request-security'

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
  const { username, password } = body as Record<string, unknown>;
  if (typeof username !== "string" || typeof password !== "string" || username.length > 64 || password.length > 256) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
  }
  const normalized = username.trim().toLowerCase()
  const db = getDatabase()
  const address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const throttleKey = createHash('sha256').update(`${address}\0${normalized}`).digest('hex')
  const throttle = await db.loginThrottle.findUnique({ where: { key: throttleKey } })
  if (throttle?.blockedUntil && throttle.blockedUntil > new Date()) return NextResponse.json({ error: 'Invalid credentials.' }, { status: 429 })
  const user = await db.user.findUnique({ where: { username: normalized } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    const now = new Date(); const reset = !throttle || now.getTime() - throttle.windowStarted.getTime() > 15 * 60_000
    const failures = reset ? 1 : throttle.failures + 1
    await db.loginThrottle.upsert({ where: { key: throttleKey }, create: { key: throttleKey, failures, windowStarted: now, blockedUntil: failures >= 5 ? new Date(now.getTime() + 15 * 60_000) : null }, update: { failures, windowStarted: reset ? now : throttle.windowStarted, blockedUntil: failures >= 5 ? new Date(now.getTime() + 15 * 60_000) : null } })
    await new Promise((resolve) => setTimeout(resolve, 350));
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  await db.loginThrottle.deleteMany({ where: { key: throttleKey } })
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
