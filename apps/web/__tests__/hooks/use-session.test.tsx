import { describe, it, expect, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import { useSession as useNextAuthSession } from "next-auth/react"
import { useSession } from "@/hooks/use-session"

vi.mock("next-auth/react")

const mockUseNextAuthSession = vi.mocked(useNextAuthSession)

describe("useSession", () => {
  it("returns unauthenticated state", () => {
    mockUseNextAuthSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    })
    const { result } = renderHook(() => useSession())
    expect(result.current.status).toBe("unauthenticated")
    expect(result.current.data).toBeNull()
  })

  it("returns authenticated state with session data", () => {
    const session = {
      user: { name: "Ada", email: "ada@example.com" },
      expires: "2099-01-01",
    }
    mockUseNextAuthSession.mockReturnValue({
      data: session,
      status: "authenticated",
      update: vi.fn(),
    })
    const { result } = renderHook(() => useSession())
    expect(result.current.status).toBe("authenticated")
    expect(result.current.data).toEqual(session)
  })

  it("returns loading state", () => {
    mockUseNextAuthSession.mockReturnValue({
      data: null,
      status: "loading",
      update: vi.fn(),
    })
    const { result } = renderHook(() => useSession())
    expect(result.current.status).toBe("loading")
  })
})
