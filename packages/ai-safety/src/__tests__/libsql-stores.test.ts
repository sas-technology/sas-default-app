import { describe, it, expect, beforeEach } from "vitest"
import { createClient } from "@libsql/client"
import {
  LibsqlRateLimitStore,
  LibsqlTokenBudgetStore,
} from "../storage/libsql-stores"

describe("LibsqlRateLimitStore", () => {
  let store: LibsqlRateLimitStore
  beforeEach(async () => {
    const client = createClient({ url: ":memory:" })
    store = new LibsqlRateLimitStore(client)
    await store.init()
  })

  it("records and returns hits within a window", async () => {
    await store.recordHit("u1", 1000)
    await store.recordHit("u1", 2000)
    await store.recordHit("u1", 3000)
    expect(await store.getWindow("u1", 1500)).toEqual([2000, 3000])
  })

  it("isolates keys", async () => {
    await store.recordHit("u1", 1000)
    await store.recordHit("u2", 1000)
    expect((await store.getWindow("u1", 0)).length).toBe(1)
    expect((await store.getWindow("u2", 0)).length).toBe(1)
  })
})

describe("LibsqlTokenBudgetStore", () => {
  let store: LibsqlTokenBudgetStore
  beforeEach(async () => {
    const client = createClient({ url: ":memory:" })
    store = new LibsqlTokenBudgetStore(client)
    await store.init()
  })

  it("sums usage within window", async () => {
    await store.record("u1", 100, 1000)
    await store.record("u1", 200, 2000)
    expect(await store.getUsageSince("u1", 1500)).toBe(200)
    expect(await store.getUsageSince("u1", 0)).toBe(300)
  })
})
