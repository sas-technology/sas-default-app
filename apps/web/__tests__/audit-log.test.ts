import { describe, it, expect, vi, afterEach } from "vitest"
import { auditLog } from "@/lib/audit-log"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("auditLog", () => {
  it("emits a single-line JSON entry on stdout with required fields", () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    auditLog({ event: "setup.attempt", outcome: "success", actor: "anon" })
    expect(spy).toHaveBeenCalledOnce()
    const line = spy.mock.calls[0]![0] as string
    const parsed = JSON.parse(line.trim())
    expect(parsed.event).toBe("setup.attempt")
    expect(parsed.outcome).toBe("success")
    expect(parsed.actor).toBe("anon")
    expect(typeof parsed.ts).toBe("string")
  })
})
