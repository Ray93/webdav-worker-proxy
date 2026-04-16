import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environmentMatchGlobs: [
      ["tests/admin/**", "jsdom"],
      ["tests/worker/**", "node"],
    ],
  },
});
