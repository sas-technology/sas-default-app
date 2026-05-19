import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock dependencies before importing the SUT. The redirect mock throws so
// requireAuth's control flow halts the same way Next's real redirect does.
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`)
  }),
}))

import { requireAuth } from "@/lib/auth-guard"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AUTH_ROUTES } from "@/lib/constants"

const mockedAuth = vi.mocked(auth)
const mockedRedirect = vi.mocked(redirect)

describe("requireAuth", () => {
  beforeEach(() => {
    mockedAuth.mockReset()
    mockedRedirect.mockClear()
  })

  it("redirects to the login route when no session exists", async () => {
    mockedAuth.mockResolvedValue(null as never)

    await expect(requireAuth()).rejects.toThrow(`REDIRECT:${AUTH_ROUTES.login}`)
    expect(mockedRedirect).toHaveBeenCalledWith(AUTH_ROUTES.login)
  })

  it("redirects to login when session exists but has no user", async () => {
    // session present but user field is missing — should still redirect
    mockedAuth.mockResolvedValue({ expires: "2099-01-01" } as never)

    await expect(requireAuth()).rejects.toThrow(`REDIRECT:${AUTH_ROUTES.login}`)
    expect(mockedRedirect).toHaveBeenCalledWith(AUTH_ROUTES.login)
  })

  it("returns the session when a user is authenticated", async () => {
    const session = {
      user: { id: "user-1", email: "a@b.com" },
      expires: "2099-01-01",
    }
    mockedAuth.mockResolvedValue(session as never)

    const result = await requireAuth()

    expect(result).toBe(session)
    expect(mockedRedirect).not.toHaveBeenCalled()
  })
})
