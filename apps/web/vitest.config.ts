import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["__tests__/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["app/**", "lib/**", "components/**", "hooks/**"],
      exclude: ["**/*.test.{ts,tsx}", "**/__tests__/**", "**/node_modules/**"],
      thresholds: {
        lines: 30,
        functions: 30,
        branches: 25,
        statements: 30,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@workspace/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@workspace/accessibility": path.resolve(
        __dirname,
        "../../packages/accessibility/src"
      ),
      "@workspace/ai-safety": path.resolve(
        __dirname,
        "../../packages/ai-safety/src"
      ),
    },
  },
})
