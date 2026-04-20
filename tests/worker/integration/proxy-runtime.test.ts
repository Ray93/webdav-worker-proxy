import { afterEach, describe, expect, it, vi } from "vitest";
import type { AppEnv } from "../../../src/shared/types";
import { routeRequest } from "../../../src/worker/router";

const route = {
  id: "route-1",
  prefix: "/dav",
  stripPrefix: true,
  targetBaseUrl: "https://upstream.test/root",
  customHeaders: [{ name: "x-upstream-token", value: "abc" }],
  enabled: true,
  createdAt: "2026-04-16T00:00:00.000Z",
  updatedAt: "2026-04-16T00:00:00.000Z",
};

function createEnv(routes: unknown[] = []): AppEnv {
  return {
    ADMIN_SESSION_SECRET: "test-secret",
    APP_KV: {
      get: async (key: string) =>
        key === "proxy.routes" ? JSON.stringify(routes) : null,
      put: async () => undefined,
    } as unknown as KVNamespace,
    ASSETS: {
      fetch: async () => new Response("asset"),
    } as unknown as Fetcher,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("proxy runtime", () => {
  it("returns 404 for unmatched requests", async () => {
    const response = await routeRequest(
      new Request("https://proxy.example.com/no-route"),
      createEnv(),
    );

    expect(response.status).toBe(404);
  });

  it("does not proxy reserved admin endpoints even when a root route exists", async () => {
    const upstreamFetch = vi.fn();
    vi.stubGlobal("fetch", upstreamFetch);

    const response = await routeRequest(
      new Request("https://proxy.example.com/api/admin"),
      createEnv([
        {
          ...route,
          prefix: "/",
        },
      ]),
    );

    expect(response.status).toBe(404);
    expect(upstreamFetch).not.toHaveBeenCalled();
  });

  it("forwards matched requests with rewritten WebDAV headers and response location", async () => {
    const upstreamFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(input).toBe("https://upstream.test/root/file.txt?download=1");

      const headers = new Headers(init?.headers);
      expect(init?.method).toBe("PROPFIND");
      expect(headers.get("x-upstream-token")).toBe("abc");
      expect(headers.get("x-client")).toBe("123");
      expect(headers.get("cookie")).toBe("theme=dark");
      expect(headers.get("destination")).toBe(
        "https://upstream.test/root/other.txt?draft=1#frag",
      );

      return new Response("ok", {
        status: 207,
        headers: {
          location: "https://upstream.test/root/other.txt?draft=1#frag",
        },
      });
    });
    vi.stubGlobal("fetch", upstreamFetch);

    const response = await routeRequest(
      new Request("https://proxy.example.com/dav/file.txt?download=1", {
        method: "PROPFIND",
        headers: {
          cookie: "theme=dark; admin_session=signed-token",
          destination: "https://proxy.example.com/dav/other.txt?draft=1#frag",
          "x-client": "123",
        },
      }),
      createEnv([route]),
    );

    expect(upstreamFetch).toHaveBeenCalledOnce();
    expect(response.status).toBe(207);
    expect(response.headers.get("location")).toBe(
      "https://proxy.example.com/dav/other.txt?draft=1#frag",
    );
  });
});
