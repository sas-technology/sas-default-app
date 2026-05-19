import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  generateSetupToken,
  readSetupToken,
  consumeSetupToken,
} from "@/lib/setup-token"

describe("setup-token", () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "setup-token-"))
    process.env.SETUP_TOKEN_PATH = join(dir, "setup-token")
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
    delete process.env.SETUP_TOKEN_PATH
  })

  it("generates and persists a token", async () => {
    const t = await generateSetupToken()
    expect(t).toMatch(/^[a-f0-9]{64}$/)
    expect(await readSetupToken()).toBe(t)
  })

  it("consumeSetupToken returns true and deletes on match", async () => {
    const t = await generateSetupToken()
    expect(await consumeSetupToken(t)).toBe(true)
    expect(await readSetupToken()).toBeNull()
  })

  it("consumeSetupToken returns false on mismatch and keeps the token", async () => {
    await generateSetupToken()
    expect(await consumeSetupToken("wrong")).toBe(false)
    expect(await readSetupToken()).not.toBeNull()
  })
})
