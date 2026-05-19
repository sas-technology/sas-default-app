import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["src/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/**"],
      exclude: ["src/__tests__/**", "src/index.ts", "src/types.ts"],
      thresholds: { lines: 30, functions: 30, branches: 25, statements: 30 },
    },
  },
})
