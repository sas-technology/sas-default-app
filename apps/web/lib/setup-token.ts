import { randomBytes } from "node:crypto"
import { readFile, writeFile, unlink } from "node:fs/promises"
import { existsSync } from "node:fs"

function tokenPath(): string {
  if (process.env.SETUP_TOKEN_PATH) return process.env.SETUP_TOKEN_PATH
  return existsSync("/.dockerenv")
    ? "/app/data/.setup-token"
    : `${process.cwd()}/.setup-token`
}

export async function generateSetupToken(): Promise<string> {
  const token = randomBytes(32).toString("hex")
  await writeFile(tokenPath(), token, { mode: 0o600 })
  return token
}

export async function readSetupToken(): Promise<string | null> {
  try {
    return (await readFile(tokenPath(), "utf-8")).trim()
  } catch {
    return null
  }
}

// In-memory lock serializes concurrent consumeSetupToken calls within this
// process, closing the TOCTOU window between read-stored and unlink.
// (For multi-process deployments, an external lock would be needed — but the
// setup endpoint is locked once any provider is configured, so the window
// where this race is reachable is small and self-closing.)
let consumeChain: Promise<unknown> = Promise.resolve()

export async function consumeSetupToken(provided: string): Promise<boolean> {
  const next = consumeChain.then(async () => {
    if (!provided) return false
    const stored = await readSetupToken()
    if (!stored || stored !== provided) return false
    await unlink(tokenPath()).catch(() => {})
    return true
  })
  // Chain even on rejection so subsequent calls don't see a poisoned lock
  consumeChain = next.catch(() => {})
  return next
}
