import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

const bootTime = Date.now()

export async function GET() {
  const checks: Record<string, "ok" | "fail"> = {}
  try {
    await db.run(sql`SELECT 1`)
    checks.db = "ok"
  } catch {
    checks.db = "fail"
  }
  const allOk = Object.values(checks).every((v) => v === "ok")
  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      uptimeSeconds: Math.floor((Date.now() - bootTime) / 1000),
      checks,
    },
    { status: allOk ? 200 : 503 }
  )
}
