import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";
import { hasTrustedOrigin } from '@/lib/auth/request-security'

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await destroySession();
  return NextResponse.json({ ok: true });
}
