import { describe, it, expect, vi } from "vitest"

// Mock `@/lib/auth` so importing the middleware module doesn't pull in the
// full NextAuth + Drizzle stack (which depends on env + node-only modules).
vi.mock("@/lib/auth", () => ({
  // auth(callback) returns a NextMiddleware. The mock must return a function
  // so middleware.ts can assign the result as a NextMiddleware value.
  auth: vi.fn(() => () => new Response()),
}))

import middleware, { config } from "@/middleware"
import { auth } from "@/lib/auth"

// Next.js consumes `config.matcher` as a path-to-regexp pattern. The matcher
// uses a negative lookahead to *exclude* a set of paths from auth handling.
// We mirror that into a JS RegExp anchored at the start of the pathname so we
// can verify the intended exclusion semantics. This guards against accidental
// removal of any item from the exclude list.
function matchesMiddlewarePath(pathname: string): boolean {
  const pattern = config.matcher[0]!
  // The matcher is shaped like "/((?!api/auth|_next/...).*)"
  // For testing we only need the negative-lookahead group.
  const groupMatch = pattern.match(/\(\?!([^)]+)\)/)
  expect(groupMatch).not.toBeNull()
  const excluded = groupMatch![1]!.split("|")
  // Strip leading slash and check no excluded prefix matches the path.
  const stripped = pathname.replace(/^\//, "")
  return !excluded.some((ex) => stripped.startsWith(ex))
}

describe("middleware", () => {
  it("is a valid middleware function wrapping auth", () => {
    // middleware.ts calls auth(callback) to compose security headers with auth.
    // Verify the composed result is a function and that auth was invoked once.
    expect(typeof middleware).toBe("function")
    expect(vi.mocked(auth)).toHaveBeenCalledTimes(1)
  })

  it("exposes a single matcher entry", () => {
    expect(Array.isArray(config.matcher)).toBe(true)
    expect(config.matcher).toHaveLength(1)
  })

  it("excludes NextAuth API routes from auth handling", () => {
    expect(matchesMiddlewarePath("/api/auth/callback/google")).toBe(false)
    expect(matchesMiddlewarePath("/api/auth/session")).toBe(false)
  })

  it("excludes Next.js internals + metadata files", () => {
    expect(matchesMiddlewarePath("/_next/static/chunks/main.js")).toBe(false)
    expect(matchesMiddlewarePath("/_next/image/optimized.png")).toBe(false)
    expect(matchesMiddlewarePath("/favicon.ico")).toBe(false)
    expect(matchesMiddlewarePath("/sitemap.xml")).toBe(false)
    expect(matchesMiddlewarePath("/robots.txt")).toBe(false)
  })

  it("runs the middleware on application routes", () => {
    expect(matchesMiddlewarePath("/")).toBe(true)
    expect(matchesMiddlewarePath("/dashboard")).toBe(true)
    expect(matchesMiddlewarePath("/login")).toBe(true)
    // /api/setup still hits middleware (no special exclusion)
    expect(matchesMiddlewarePath("/api/setup")).toBe(true)
    // /api/health is excluded from auth middleware (public health check)
    expect(matchesMiddlewarePath("/api/health")).toBe(false)
  })
})
