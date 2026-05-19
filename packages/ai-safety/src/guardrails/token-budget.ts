import type { TokenBudgetConfig, TokenBudgetResult } from "../types"
import { MemoryTokenBudgetStore } from "../storage/memory-stores"
import type { TokenBudgetStore } from "../storage/types"

const DEFAULT_CONFIG = {
  maxTokensPerRequest: 4_096,
  maxTokensPerUserPerHour: 100_000,
}
const HOUR_MS = 3_600_000

export class TokenBudget {
  private store: TokenBudgetStore
  private config: {
    maxTokensPerRequest: number
    maxTokensPerUserPerHour: number
  }

  constructor(config: Partial<TokenBudgetConfig> = {}) {
    const { store, ...rest } = config
    this.config = { ...DEFAULT_CONFIG, ...rest }
    this.store = store ?? new MemoryTokenBudgetStore()
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  async check(userId: string, inputText: string): Promise<TokenBudgetResult> {
    const estimated = this.estimateTokens(inputText)
    const used = await this.store.getUsageSince(userId, Date.now() - HOUR_MS)
    const remaining = this.config.maxTokensPerUserPerHour - used
    if (estimated > this.config.maxTokensPerRequest) {
      return {
        allowed: false,
        estimatedTokens: estimated,
        remainingBudget: remaining,
      }
    }
    return {
      allowed: estimated <= remaining,
      estimatedTokens: estimated,
      remainingBudget: remaining,
    }
  }

  async record(userId: string, tokens: number): Promise<void> {
    await this.store.record(userId, tokens, Date.now())
  }
}
