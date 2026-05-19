import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { aiSafety } from "@/lib/ai-safety"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Sign in to use AI features" },
      { status: 401 }
    )
  }

  const { prompt } = (await request.json()) as { prompt?: string }
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 })
  }

  const safe = await aiSafety({
    rateLimit: { maxRequests: 10, windowMs: 60_000 },
    sanitize: { maxLength: 4000, sensitivity: "medium" },
    contentSafety: {
      categories: [
        "violence",
        "hate_speech",
        "sexual_content",
        "self_harm",
        "illegal_activity",
      ],
    },
    piiRedactor: { types: ["email", "phone", "ssn", "credit_card"] },
    tokenBudget: {
      maxTokensPerRequest: 1000,
      maxTokensPerUserPerHour: 10_000,
    },
  })

  const result = await safe(
    { userId: session.user.email, input: prompt },
    async (sanitizedInput) => {
      // STUB: replace this with a real model call (OpenAI / Anthropic / etc.)
      // Token usage MUST be reported — the middleware needs it to enforce budgets.
      const output = `Echo: ${sanitizedInput}`
      const tokensUsed = Math.ceil((sanitizedInput.length + output.length) / 4)
      return { output, tokensUsed }
    }
  )

  if (!result.success) {
    return NextResponse.json(
      { error: result.error, metadata: result.metadata },
      { status: 400 }
    )
  }

  return NextResponse.json({
    output: result.output,
    metadata: result.metadata,
  })
}
