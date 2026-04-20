import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    globals: true,
    include: ["tests/worker/**/*.test.ts"],
    exclude: ["**/*.js", "**/node_modules/**", "**/dist/**"],
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.test.jsonc" },
      },
    },
  },
});
