import { describe, it, expect } from "vitest"
import { GET } from "@/app/api/health/route"

describe("GET /api/health", () => {
  it("returns 200 with status=ok when db is reachable", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe("ok")
    expect(body.checks.db).toBe("ok")
    expect(typeof body.uptimeSeconds).toBe("number")
  })
})
