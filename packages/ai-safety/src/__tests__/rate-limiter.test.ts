import { describe, it, expect, beforeEach } from "vitest"
import { RateLimiter } from "../guardrails/rate-limiter"

describe("RateLimiter", () => {
  let limiter: RateLimiter

  beforeEach(() => {
    limiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 })
  })

  it("allows requests within the limit", async () => {
    const result = await limiter.check("user1")
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(2)
  })

  it("blocks requests exceeding the limit", async () => {
    await limiter.check("user1")
    await limiter.check("user1")
    await limiter.check("user1")

    const result = await limiter.check("user1")
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it("tracks limits independently per key", async () => {
    await limiter.check("user1")
    await limiter.check("user1")
    await limiter.check("user1")

    const result = await limiter.check("user2")
    expect(result.allowed).toBe(true)
  })

  it("resets all entries", async () => {
    await limiter.check("user1")
    await limiter.check("user1")
    await limiter.check("user1")

    await limiter.reset()

    const result = await limiter.check("user1")
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(2)
  })
})
