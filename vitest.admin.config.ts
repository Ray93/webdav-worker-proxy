import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/admin/**/*.test.tsx"],
    exclude: ["**/*.js", "**/node_modules/**", "**/dist/**"],
    environment: "jsdom",
    setupFiles: ["./tests/admin/setup.ts"],
  },
});
