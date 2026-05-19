import type { RateLimitStore } from "./storage/types"

export interface RateLimitConfig {
  /** Maximum requests per window */
  maxRequests: number
  /** Window size in milliseconds */
  windowMs: number
  /** Optional pluggable storage backend (defaults to in-memory) */
  store?: RateLimitStore
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export interface SanitizeConfig {
  /** Maximum input length in characters */
  maxLength: number
  /** Sensitivity level: low catches obvious attacks, high is more aggressive */
  sensitivity: "low" | "medium" | "high"
}

export interface SanitizeResult {
  safe: boolean
  sanitized: string
  flags: string[]
}

export interface OutputFilterConfig {
  /** Patterns to block from output */
  blocklist: RegExp[]
  /** Maximum output length in characters */
  maxLength: number
}

export interface OutputFilterResult {
  filtered: string
  redactedCount: number
}

export interface TokenBudgetConfig {
  /** Maximum tokens per request */
  maxTokensPerRequest: number
  /** Maximum tokens per user per hour */
  maxTokensPerUserPerHour: number
}

export interface TokenBudgetResult {
  allowed: boolean
  estimatedTokens: number
  remainingBudget: number
}

export interface ContentSafetyConfig {
  /** Categories to check */
  categories: ContentCategory[]
  /** Hook for external moderation APIs */
  externalModerator?: (content: string) => Promise<ContentSafetyResult>
}

export type ContentCategory =
  | "violence"
  | "hate_speech"
  | "sexual_content"
  | "self_harm"
  | "illegal_activity"

export interface ContentSafetyResult {
  safe: boolean
  flaggedCategories: ContentCategory[]
  confidence: number
}

export interface PiiRedactorConfig {
  /** Types of PII to detect */
  types: PiiType[]
  /** Replacement pattern (default: "[REDACTED]") */
  replacement?: string
}

export type PiiType = "email" | "phone" | "ssn" | "credit_card" | "ip_address"

export interface PiiRedactorResult {
  redacted: string
  detectedCount: number
  detectedTypes: PiiType[]
}

export interface AiSafetyMiddlewareConfig {
  rateLimit?: RateLimitConfig
  sanitize?: SanitizeConfig
  outputFilter?: OutputFilterConfig
  tokenBudget?: TokenBudgetConfig
  contentSafety?: ContentSafetyConfig
  piiRedactor?: PiiRedactorConfig
}
