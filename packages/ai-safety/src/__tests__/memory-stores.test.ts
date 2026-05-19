import { describe, it, expect } from "vitest"
import {
  MemoryRateLimitStore,
  MemoryTokenBudgetStore,
} from "../storage/memory-stores"

describe("MemoryRateLimitStore", () => {
  it("records and returns hits within a window", async () => {
    const s = new MemoryRateLimitStore()
    await s.recordHit("u1", 1000)
    await s.recordHit("u1", 2000)
    await s.recordHit("u1", 3000)
    expect(await s.getWindow("u1", 1500)).toEqual([2000, 3000])
  })

  it("prune removes old entries", async () => {
    const s = new MemoryRateLimitStore()
    await s.recordHit("u1", 1000)
    await s.recordHit("u1", 2000)
    await s.prune(1500)
    expect(await s.getWindow("u1", 0)).toEqual([2000])
  })
})

describe("MemoryTokenBudgetStore", () => {
  it("sums usage within window", async () => {
    const s = new MemoryTokenBudgetStore()
    await s.record("u1", 100, 1000)
    await s.record("u1", 200, 2000)
    expect(await s.getUsageSince("u1", 1500)).toBe(200)
    expect(await s.getUsageSince("u1", 0)).toBe(300)
  })
})
