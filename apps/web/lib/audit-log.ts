type AuditEvent = {
  event: string
  outcome: "success" | "failure" | "denied"
  actor: string
  detail?: Record<string, unknown>
}

export function auditLog(entry: AuditEvent): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level: "audit",
    ...entry,
  })
  process.stdout.write(line + "\n")
}
