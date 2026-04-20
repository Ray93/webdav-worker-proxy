import { describe, expect, it, vi } from "vitest";
import type { AppEnv } from "../../../src/shared/types";
import { routeRequest } from "../../../src/worker/router";

function createEnv(assetFetch: (request: Request) => Promise<Response>): AppEnv {
  return {
    ADMIN_SESSION_SECRET: "test-secret",
    APP_KV: {
      get: async () => null,
      put: async () => undefined,
    } as unknown as KVNamespace,
    ASSETS: {
      fetch: assetFetch,
    } as unknown as Fetcher,
  };
}

describe("routeRequest admin assets", () => {
  it("rewrites /admin to the built index asset", async () => {
    const assetFetch = vi.fn(async (request: Request) => {
      expect(new URL(request.url).pathname).toBe("/index.html");
      return new Response("index");
    });

    const response = await routeRequest(
      new Request("https://example.com/admin"),
      createEnv(assetFetch),
    );

    expect(assetFetch).toHaveBeenCalledOnce();
    expect(await response.text()).toBe("index");
  });

  it("strips the /admin prefix for static asset requests", async () => {
    const assetFetch = vi.fn(async (request: Request) => {
      expect(new URL(request.url).pathname).toBe("/assets/index.js");
      return new Response("asset");
    });

    const response = await routeRequest(
      new Request("https://example.com/admin/assets/index.js"),
      createEnv(assetFetch),
    );

    expect(assetFetch).toHaveBeenCalledOnce();
    expect(await response.text()).toBe("asset");
  });
});
