import type { RateLimitStore, TokenBudgetStore } from "./types"

export class MemoryRateLimitStore implements RateLimitStore {
  private windows = new Map<string, number[]>()

  async getWindow(key: string, sinceMs: number): Promise<number[]> {
    return (this.windows.get(key) ?? []).filter((t) => t > sinceMs)
  }

  async recordHit(key: string, atMs: number): Promise<void> {
    const arr = this.windows.get(key) ?? []
    arr.push(atMs)
    this.windows.set(key, arr)
  }

  async prune(beforeMs: number): Promise<void> {
    for (const [k, arr] of this.windows) {
      this.windows.set(
        k,
        arr.filter((t) => t > beforeMs)
      )
    }
  }
}

export class MemoryTokenBudgetStore implements TokenBudgetStore {
  private events = new Map<string, Array<{ tokens: number; at: number }>>()

  async getUsageSince(userId: string, sinceMs: number): Promise<number> {
    return (this.events.get(userId) ?? [])
      .filter((e) => e.at > sinceMs)
      .reduce((sum, e) => sum + e.tokens, 0)
  }

  async record(userId: string, tokens: number, atMs: number): Promise<void> {
    const arr = this.events.get(userId) ?? []
    arr.push({ tokens, at: atMs })
    this.events.set(userId, arr)
  }

  async prune(beforeMs: number): Promise<void> {
    for (const [k, arr] of this.events) {
      this.events.set(
        k,
        arr.filter((e) => e.at > beforeMs)
      )
    }
  }
}
