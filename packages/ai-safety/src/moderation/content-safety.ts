import type {
  ContentSafetyConfig,
  ContentSafetyResult,
  ContentCategory,
} from "../types"

/** Keyword patterns for baseline content moderation */
const CATEGORY_PATTERNS: Record<ContentCategory, RegExp[]> = {
  violence: [
    /\b(kill|murder|attack|bomb|weapon|shoot|stab|assault)\b/i,
    /\b(how\s+to\s+(make|build)\s+(a\s+)?(bomb|weapon|explosive))\b/i,
  ],
  hate_speech: [
    /\b(hate|inferior|subhuman)\b.*\b(race|ethnicity|religion|gender)\b/i,
    /\b(genocide|ethnic\s+cleansing)\b/i,
  ],
  sexual_content: [/\b(explicit|pornograph)/i],
  self_harm: [
    /\b(suicide|self[_-]?harm)\b.*\b(method|how\s+to)\b/i,
    /\b(how\s+to)\b.*\b(hurt|harm)\s+(myself|yourself)\b/i,
  ],
  illegal_activity: [
    /\b(how\s+to)\b.*\b(hack|steal|forge|counterfeit)\b/i,
    /\b(illegal|illicit)\b.*\b(drug|substance)\b.*\b(make|manufacture|produce)\b/i,
  ],
}

const DEFAULT_CONFIG: ContentSafetyConfig = {
  categories: [
    "violence",
    "hate_speech",
    "sexual_content",
    "self_harm",
    "illegal_activity",
  ],
}

/**
 * Baseline content moderation using keyword/pattern matching.
 * For production use, integrate an external moderation API via the
 * `externalModerator` config hook.
 */
export async function checkContentSafety(
  content: string,
  config: Partial<ContentSafetyConfig> = {}
): Promise<ContentSafetyResult> {
  const { categories, externalModerator } = { ...DEFAULT_CONFIG, ...config }

  // If an external moderator is configured, delegate to it
  if (externalModerator) {
    return externalModerator(content)
  }

  // Baseline pattern matching
  const flaggedCategories: ContentCategory[] = []
  let matchCount = 0

  for (const category of categories) {
    const patterns = CATEGORY_PATTERNS[category]
    if (!patterns) continue
    let categoryMatched = false
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        matchCount++
        categoryMatched = true
      }
    }
    if (categoryMatched) flaggedCategories.push(category)
  }

  // Confidence: 1 = no flags, otherwise rises with more matches (asymptotes to 1).
  const confidence =
    flaggedCategories.length === 0 ? 1 : 1 - 1 / (1 + matchCount)

  return { safe: flaggedCategories.length === 0, flaggedCategories, confidence }
}
