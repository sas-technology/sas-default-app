import type { AiSafetyMiddlewareConfig } from "../types"
import { RateLimiter } from "../guardrails/rate-limiter"
import { sanitizeInput } from "../guardrails/input-sanitizer"
import { filterOutput } from "../guardrails/output-filter"
import { TokenBudget } from "../guardrails/token-budget"
import { redactPii } from "../moderation/pii-redactor"
import { checkContentSafety } from "../moderation/content-safety"

interface AiRequest {
  userId: string
  input: string
}

interface AiResponse {
  output: string
  tokensUsed: number
}

type AiHandler = (input: string) => Promise<AiResponse>

interface SafetyResult {
  success: boolean
  output?: string
  error?: string
  metadata?: {
    rateLimitRemaining?: number
    sanitizeFlags?: string[]
    redactedCount?: number
    tokensUsed?: number
  }
}

/**
 * Composes all safety guardrails into a single middleware pipeline.
 * Chains: rate limit → sanitize input → check content → [call AI] → filter output → redact PII
 */
export function createAiSafetyMiddleware(
  config: AiSafetyMiddlewareConfig = {}
) {
  const rateLimiter = config.rateLimit
    ? new RateLimiter(config.rateLimit)
    : undefined
  const tokenBudget = config.tokenBudget
    ? new TokenBudget(config.tokenBudget)
    : undefined

  return async function safeAiCall(
    request: AiRequest,
    handler: AiHandler
  ): Promise<SafetyResult> {
    const metadata: SafetyResult["metadata"] = {}

    // 1. Rate limiting
    if (rateLimiter) {
      const rateResult = await rateLimiter.check(request.userId)
      metadata.rateLimitRemaining = rateResult.remaining
      if (!rateResult.allowed) {
        return { success: false, error: "Rate limit exceeded", metadata }
      }
    }

    // 2. Input sanitization
    const sanitizeResult = sanitizeInput(request.input, config.sanitize)
    metadata.sanitizeFlags = sanitizeResult.flags
    if (!sanitizeResult.safe) {
      return {
        success: false,
        error: "Input failed safety check",
        metadata,
      }
    }

    // 3. Content safety check on input
    if (config.contentSafety) {
      const safetyResult = await checkContentSafety(
        sanitizeResult.sanitized,
        config.contentSafety
      )
      if (!safetyResult.safe) {
        return {
          success: false,
          error: `Content flagged: ${safetyResult.flaggedCategories.join(", ")}`,
          metadata,
        }
      }
    }

    // 4. Token budget check
    if (tokenBudget) {
      const budgetResult = await tokenBudget.check(
        request.userId,
        sanitizeResult.sanitized
      )
      if (!budgetResult.allowed) {
        return { success: false, error: "Token budget exceeded", metadata }
      }
    }

    // 5. Call the AI handler
    const response = await handler(sanitizeResult.sanitized)

    // 6. Record token usage. Handler is required to return tokensUsed; fall
    //    back to an estimate if a caller bypassed the type check.
    if (tokenBudget) {
      const tokens =
        typeof response.tokensUsed === "number" && response.tokensUsed > 0
          ? response.tokensUsed
          : tokenBudget.estimateTokens(sanitizeResult.sanitized) +
            tokenBudget.estimateTokens(response.output)
      await tokenBudget.record(request.userId, tokens)
      metadata.tokensUsed = tokens
    }

    // 7. Filter output
    const filterResult = filterOutput(response.output, config.outputFilter)
    metadata.redactedCount = filterResult.redactedCount

    // 8. Redact PII from output
    const piiResult = redactPii(filterResult.filtered, config.piiRedactor)
    metadata.redactedCount =
      (metadata.redactedCount ?? 0) + piiResult.detectedCount

    return {
      success: true,
      output: piiResult.redacted,
      metadata,
    }
  }
}
