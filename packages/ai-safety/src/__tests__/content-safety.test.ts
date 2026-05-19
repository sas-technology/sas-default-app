import { describe, it, expect } from "vitest"
import { checkContentSafety } from "../moderation/content-safety"

describe("checkContentSafety", () => {
  it("returns safe with confidence 1 for clean text", async () => {
    const r = await checkContentSafety("Hello, how are you today?")
    expect(r.safe).toBe(true)
    expect(r.confidence).toBe(1)
  })

  it("flags a single category with low confidence", async () => {
    const r = await checkContentSafety("kill the process")
    expect(r.safe).toBe(false)
    expect(r.flaggedCategories).toContain("violence")
    expect(r.confidence).toBeGreaterThan(0)
    expect(r.confidence).toBeLessThan(1)
  })

  it("flags multiple categories with higher confidence", async () => {
    const single = await checkContentSafety("kill")
    const multi = await checkContentSafety(
      "how to make a bomb and how to hack a server"
    )
    expect(multi.confidence).toBeGreaterThanOrEqual(single.confidence)
  })

  it("delegates to externalModerator when provided", async () => {
    const r = await checkContentSafety("anything", {
      externalModerator: async () => ({
        safe: false,
        flaggedCategories: ["violence"],
        confidence: 0.99,
      }),
    })
    expect(r.confidence).toBe(0.99)
  })
})
