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

export async function consumeSetupToken(provided: string): Promise<boolean> {
  const stored = await readSetupToken()
  if (!stored || stored !== provided) return false
  await unlink(tokenPath()).catch(() => {})
  return true
}
