import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))
vi.mock("@/lib/ai-safety", () => ({
  aiSafety: vi.fn(),
}))

import { POST } from "@/app/api/example-ai/route"
import { auth } from "@/lib/auth"
import { aiSafety } from "@/lib/ai-safety"

const mockReq = (body: unknown) =>
  new Request("http://localhost:11000/api/example-ai", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  })

describe("POST /api/example-ai", () => {
  beforeEach(() => vi.resetAllMocks())

  it("returns 401 when not signed in", async () => {
    ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const res = await POST(mockReq({ prompt: "hi" }))
    expect(res.status).toBe(401)
  })

  it("returns the safe output for a signed-in user", async () => {
    ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: "u@example.com" },
    })
    ;(aiSafety as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      async (_req: unknown, handler: (i: string) => Promise<unknown>) => {
        const r = (await handler("hello")) as {
          output: string
          tokensUsed: number
        }
        return {
          success: true,
          output: r.output,
          metadata: { tokensUsed: r.tokensUsed },
        }
      }
    )
    const res = await POST(mockReq({ prompt: "hello" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.output).toBe("Echo: hello")
  })
})
