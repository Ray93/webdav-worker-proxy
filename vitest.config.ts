import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

const runWithSecret = process.argv.some((arg) => arg.includes("tests/worker/integration/admin-routes.test.ts"));

export default defineWorkersConfig({
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
    exclude: ["**/*.js", "**/node_modules/**", "**/dist/**"],
    poolOptions: {
      workers: {
        wrangler: {
          configPath: "./wrangler.test.jsonc",
          ...(runWithSecret ? { environment: "with_secret" } : {}),
        },
      },
    },
  },
});
