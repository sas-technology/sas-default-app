import type { Client } from "@libsql/client"
import type { RateLimitStore, TokenBudgetStore } from "./types"

const RATE_TABLE = "ai_safety_rate_limit"
const USAGE_TABLE = "ai_safety_token_usage"

export class LibsqlRateLimitStore implements RateLimitStore {
  constructor(private client: Client) {}

  async init(): Promise<void> {
    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS ${RATE_TABLE} (
        key TEXT NOT NULL,
        ts INTEGER NOT NULL
      )
    `)
    await this.client.execute(
      `CREATE INDEX IF NOT EXISTS idx_${RATE_TABLE}_key_ts ON ${RATE_TABLE}(key, ts)`
    )
  }

  async getWindow(key: string, sinceMs: number): Promise<number[]> {
    const res = await this.client.execute({
      sql: `SELECT ts FROM ${RATE_TABLE} WHERE key = ? AND ts > ? ORDER BY ts`,
      args: [key, sinceMs],
    })
    return res.rows.map((r) => Number(r.ts))
  }

  async recordHit(key: string, atMs: number): Promise<void> {
    await this.client.execute({
      sql: `INSERT INTO ${RATE_TABLE} (key, ts) VALUES (?, ?)`,
      args: [key, atMs],
    })
  }

  async prune(beforeMs: number): Promise<void> {
    await this.client.execute({
      sql: `DELETE FROM ${RATE_TABLE} WHERE ts <= ?`,
      args: [beforeMs],
    })
  }
}

export class LibsqlTokenBudgetStore implements TokenBudgetStore {
  constructor(private client: Client) {}

  async init(): Promise<void> {
    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS ${USAGE_TABLE} (
        user_id TEXT NOT NULL,
        tokens INTEGER NOT NULL,
        ts INTEGER NOT NULL
      )
    `)
    await this.client.execute(
      `CREATE INDEX IF NOT EXISTS idx_${USAGE_TABLE}_user_ts ON ${USAGE_TABLE}(user_id, ts)`
    )
  }

  async getUsageSince(userId: string, sinceMs: number): Promise<number> {
    const res = await this.client.execute({
      sql: `SELECT COALESCE(SUM(tokens), 0) AS total FROM ${USAGE_TABLE} WHERE user_id = ? AND ts > ?`,
      args: [userId, sinceMs],
    })
    return Number(res.rows[0]?.total ?? 0)
  }

  async record(userId: string, tokens: number, atMs: number): Promise<void> {
    await this.client.execute({
      sql: `INSERT INTO ${USAGE_TABLE} (user_id, tokens, ts) VALUES (?, ?, ?)`,
      args: [userId, tokens, atMs],
    })
  }

  async prune(beforeMs: number): Promise<void> {
    await this.client.execute({
      sql: `DELETE FROM ${USAGE_TABLE} WHERE ts <= ?`,
      args: [beforeMs],
    })
  }
}
