import { NextResponse } from "next/server";

import { db } from "@/data/server/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({ database: "ok" });
  } catch (error) {
    console.error("Database health check failed", error);

    return NextResponse.json({ database: "unavailable" }, { status: 503 });
  }
}
