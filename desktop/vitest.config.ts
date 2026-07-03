import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "cobertura"],
      reportsDirectory: "./coverage",
      exclude: ["test/**", "src-tauri/**"],
      thresholds: {
        statements: 95,
        lines: 95,
        functions: 90,
        branches: 80,
      },
    },
  },
});
