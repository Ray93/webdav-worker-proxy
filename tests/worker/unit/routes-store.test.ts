import { describe, expect, it } from "vitest";
import {
  listRoutes,
  saveRoutes,
  validateRouteInput,
} from "../../../src/worker/store/routes-store";

describe("validateRouteInput", () => {
  it("rejects reserved prefixes and duplicate route prefixes", () => {
    expect(() =>
      validateRouteInput(
        {
          prefix: "/admin",
          stripPrefix: true,
          targetBaseUrl: "https://dav.example.com",
          customHeaders: [],
          enabled: true,
        },
        [],
      ),
    ).toThrow("prefix is reserved");

    expect(() =>
      validateRouteInput(
        {
          prefix: "/dav",
          stripPrefix: true,
          targetBaseUrl: "https://dav.example.com",
          customHeaders: [],
          enabled: true,
        },
        [
          {
            id: "r1",
            prefix: "/dav",
            stripPrefix: true,
            targetBaseUrl: "https://dav.example.com",
            customHeaders: [],
            enabled: true,
            createdAt: "a",
            updatedAt: "a",
          },
        ],
      ),
    ).toThrow("prefix already exists");
  });

  it("rejects malformed-but-prefixed target URL", () => {
    expect(() =>
      validateRouteInput(
        {
          prefix: "/dav",
          stripPrefix: true,
          targetBaseUrl: "https://",
          customHeaders: [],
          enabled: true,
        },
        [],
      ),
    ).toThrow("targetBaseUrl must be an http or https URL");
  });

  it("rejects trailing slash prefixes except root", () => {
    expect(() =>
      validateRouteInput(
        {
          prefix: "/dav/",
          stripPrefix: true,
          targetBaseUrl: "https://dav.example.com",
          customHeaders: [],
          enabled: true,
        },
        [],
      ),
    ).toThrow("prefix must not end with /");
  });

  it("rejects non-canonical prefixes", () => {
    expect(() =>
      validateRouteInput(
        {
          prefix: "/dav name",
          stripPrefix: true,
          targetBaseUrl: "https://dav.example.com",
          customHeaders: [],
          enabled: true,
        },
        [],
      ),
    ).toThrow("prefix must be a stable pathname");
  });

  it("rejects prefixes containing query", () => {
    expect(() =>
      validateRouteInput(
        {
          prefix: "/dav?x=1",
          stripPrefix: true,
          targetBaseUrl: "https://dav.example.com",
          customHeaders: [],
          enabled: true,
        },
        [],
      ),
    ).toThrow("prefix must be a stable pathname");
  });

  it("rejects prefixes containing hash", () => {
    expect(() =>
      validateRouteInput(
        {
          prefix: "/dav#x",
          stripPrefix: true,
          targetBaseUrl: "https://dav.example.com",
          customHeaders: [],
          enabled: true,
        },
        [],
      ),
    ).toThrow("prefix must be a stable pathname");
  });

  it("rejects empty header names", () => {
    expect(() =>
      validateRouteInput(
        {
          prefix: "/dav",
          stripPrefix: true,
          targetBaseUrl: "https://dav.example.com",
          customHeaders: [{ name: "   ", value: "value" }],
          enabled: true,
        },
        [],
      ),
    ).toThrow("header name is required");
  });

  it("rejects malformed header names", () => {
    expect(() =>
      validateRouteInput(
        {
          prefix: "/dav",
          stripPrefix: true,
          targetBaseUrl: "https://dav.example.com",
          customHeaders: [{ name: "bad header", value: "value" }],
          enabled: true,
        },
        [],
      ),
    ).toThrow("header name is invalid");
  });

  it("rejects hop-by-hop headers", () => {
    expect(() =>
      validateRouteInput(
        {
          prefix: "/dav",
          stripPrefix: true,
          targetBaseUrl: "https://dav.example.com",
          customHeaders: [{ name: "Connection", value: "keep-alive" }],
          enabled: true,
        },
        [],
      ),
    ).toThrow("header name is forbidden");
  });

  it("rejects header names with surrounding whitespace", () => {
    expect(() =>
      validateRouteInput(
        {
          prefix: "/dav",
          stripPrefix: true,
          targetBaseUrl: "https://dav.example.com",
          customHeaders: [{ name: " X-Test ", value: "value" }],
          enabled: true,
        },
        [],
      ),
    ).toThrow("header name must not contain surrounding whitespace");
  });

  it("rejects header values with newline", () => {
    expect(() =>
      validateRouteInput(
        {
          prefix: "/dav",
          stripPrefix: true,
          targetBaseUrl: "https://dav.example.com",
          customHeaders: [{ name: "X-Test", value: "line1\nline2" }],
          enabled: true,
        },
        [],
      ),
    ).toThrow("header value is invalid");
  });
});

describe("routes kv persistence", () => {
  it("round-trips routes through saveRoutes and listRoutes", async () => {
    const kv = new Map<string, string>();
    const env = {
      APP_KV: {
        get: async (key: string) => kv.get(key) ?? null,
        put: async (key: string, value: string) => {
          kv.set(key, value);
        },
      },
    };

    const routes = [
      {
        id: "r1",
        prefix: "/dav",
        stripPrefix: true,
        targetBaseUrl: "https://dav.example.com",
        customHeaders: [],
        enabled: true,
        createdAt: "2026-04-18T00:00:00.000Z",
        updatedAt: "2026-04-18T00:00:00.000Z",
      },
    ];

    await saveRoutes(env as never, routes);
    await expect(listRoutes(env as never)).resolves.toEqual(routes);
  });
});
