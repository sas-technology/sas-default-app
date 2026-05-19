import { createClient } from "@libsql/client"
import {
  createAiSafetyMiddleware,
  LibsqlRateLimitStore,
  LibsqlTokenBudgetStore,
  type AiSafetyMiddlewareConfig,
} from "@workspace/ai-safety"

const url = process.env.DATABASE_URL ?? "file:./dev.db"
const authToken = process.env.DATABASE_AUTH_TOKEN

const sharedClient = createClient({ url, authToken })

const rateStore = new LibsqlRateLimitStore(sharedClient)
const budgetStore = new LibsqlTokenBudgetStore(sharedClient)
let initialized = false

async function ensureInit() {
  if (initialized) return
  await rateStore.init()
  await budgetStore.init()
  initialized = true
}

type SafeAiCall = ReturnType<typeof createAiSafetyMiddleware>

/** Returns a middleware with persistent rate-limit + token-budget stores. */
export async function aiSafety(
  config: AiSafetyMiddlewareConfig = {}
): Promise<SafeAiCall> {
  await ensureInit()
  return createAiSafetyMiddleware({
    ...config,
    rateLimit: {
      maxRequests: 30,
      windowMs: 60_000,
      ...config.rateLimit,
      store: rateStore,
    },
    tokenBudget: {
      maxTokensPerRequest: 4_096,
      maxTokensPerUserPerHour: 100_000,
      ...config.tokenBudget,
      store: budgetStore,
    },
  })
}
