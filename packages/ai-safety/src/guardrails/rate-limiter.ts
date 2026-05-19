import type { RateLimitConfig, RateLimitResult } from "../types"
import { MemoryRateLimitStore } from "../storage/memory-stores"
import type { RateLimitStore } from "../storage/types"

const DEFAULT_CONFIG = { maxRequests: 60, windowMs: 60_000 }

export class RateLimiter {
  private store: RateLimitStore
  private config: { maxRequests: number; windowMs: number }

  constructor(config: Partial<RateLimitConfig> = {}) {
    const { store, ...rest } = config
    this.config = { ...DEFAULT_CONFIG, ...rest }
    this.store = store ?? new MemoryRateLimitStore()
  }

  async check(key: string): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = now - this.config.windowMs
    const hits = await this.store.getWindow(key, windowStart)
    const allowed = hits.length < this.config.maxRequests
    if (allowed) await this.store.recordHit(key, now)
    return {
      allowed,
      remaining: Math.max(
        0,
        this.config.maxRequests - hits.length - (allowed ? 1 : 0)
      ),
      resetAt: windowStart + this.config.windowMs,
    }
  }

  async reset(): Promise<void> {
    await this.store.prune(Date.now())
  }
}
