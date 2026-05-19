import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    projects: [
      "apps/web/vitest.config.ts",
      "packages/ai-safety/vitest.config.ts",
      "packages/accessibility/vitest.config.ts",
    ],
  },
})
