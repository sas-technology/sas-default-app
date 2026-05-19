import { describe, it, expect } from "vitest"
import { filterOutput } from "../guardrails/output-filter"

describe("filterOutput", () => {
  it("returns input unchanged when no patterns match", () => {
    const r = filterOutput("Hello, this is fine.")
    expect(r.filtered).toBe("Hello, this is fine.")
    expect(r.redactedCount).toBe(0)
  })

  it("redacts api-key-style assignments", () => {
    const r = filterOutput("Here is your api_key: sk_live_abcdefghijklmnopqrst")
    expect(r.filtered).toContain("[REDACTED]")
    expect(r.redactedCount).toBeGreaterThanOrEqual(1)
  })

  it("redacts AWS access key IDs", () => {
    const r = filterOutput("AKIAABCDEFGHIJKLMNOP")
    expect(r.filtered).toContain("[REDACTED]")
    expect(r.redactedCount).toBe(1)
  })

  it("truncates at maxLength and increments redactedCount", () => {
    const r = filterOutput("a".repeat(60_000))
    expect(r.filtered.length).toBe(50_000)
    expect(r.redactedCount).toBe(1)
  })

  it("custom blocklist overrides defaults", () => {
    const r = filterOutput("password is hunter2-secret-token", {
      blocklist: [/hunter2-secret-token/g],
      maxLength: 50_000,
    })
    expect(r.filtered).toContain("[REDACTED]")
    expect(r.filtered).not.toContain("hunter2-secret-token")
  })
})
