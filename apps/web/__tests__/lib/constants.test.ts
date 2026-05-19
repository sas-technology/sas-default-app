import { describe, it, expect } from "vitest"
import {
  APP_NAME,
  APP_DESCRIPTION,
  AUTH_ROUTES,
  PUBLIC_ROUTES,
} from "@/lib/constants"

describe("constants", () => {
  it("APP_NAME is a non-empty string", () => {
    expect(typeof APP_NAME).toBe("string")
    expect(APP_NAME.length).toBeGreaterThan(0)
  })

  it("APP_DESCRIPTION is a non-empty string", () => {
    expect(typeof APP_DESCRIPTION).toBe("string")
    expect(APP_DESCRIPTION.length).toBeGreaterThan(0)
  })

  it("AUTH_ROUTES exposes login + callback paths starting with /", () => {
    expect(AUTH_ROUTES.login).toMatch(/^\//)
    expect(AUTH_ROUTES.callback).toMatch(/^\//)
  })

  it("PUBLIC_ROUTES includes the login route", () => {
    expect(PUBLIC_ROUTES).toContain(AUTH_ROUTES.login)
  })

  it("PUBLIC_ROUTES are all rooted paths", () => {
    for (const route of PUBLIC_ROUTES) {
      expect(route).toMatch(/^\//)
    }
  })
})
