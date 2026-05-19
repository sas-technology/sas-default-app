export interface RateLimitStore {
  /** Returns timestamps (ms epoch) for a key within the given window. */
  getWindow(key: string, sinceMs: number): Promise<number[]>
  /** Records a single timestamp. */
  recordHit(key: string, atMs: number): Promise<void>
  /** Removes timestamps older than the given cutoff (housekeeping). */
  prune(beforeMs: number): Promise<void>
}

export interface TokenBudgetStore {
  /** Returns total tokens used by the user since the given cutoff. */
  getUsageSince(userId: string, sinceMs: number): Promise<number>
  /** Records a token-use event. */
  record(userId: string, tokens: number, atMs: number): Promise<void>
  /** Removes entries older than the given cutoff (housekeeping). */
  prune(beforeMs: number): Promise<void>
}
