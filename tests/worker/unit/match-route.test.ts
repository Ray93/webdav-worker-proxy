import { describe, expect, it } from "vitest";
import { matchRoute } from "../../../src/worker/proxy/match-route";
import { buildTargetUrl } from "../../../src/worker/proxy/build-target-url";

describe("proxy route matching", () => {
  it("uses the longest enabled prefix and builds the target URL correctly", () => {
    const routes = [
      {
        id: "1",
        prefix: "/dav",
        stripPrefix: true,
        targetBaseUrl: "https://dav.example.com/root",
        customHeaders: [],
        enabled: true,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "2",
        prefix: "/dav/private",
        stripPrefix: false,
        targetBaseUrl: "https://dav.example.com/root",
        customHeaders: [],
        enabled: true,
        createdAt: "",
        updatedAt: "",
      },
    ];

    const matched = matchRoute("/dav/private/file.txt", routes);
    expect(matched?.id).toBe("2");
    expect(
      buildTargetUrl(
        matched!,
        new URL("https://proxy.example.com/dav/private/file.txt"),
      ),
    ).toBe("https://dav.example.com/root/dav/private/file.txt");
  });

  it("matches root prefix as a catch-all for subpaths", () => {
    const routes = [
      {
        id: "root",
        prefix: "/",
        stripPrefix: false,
        targetBaseUrl: "https://dav.example.com/root",
        customHeaders: [],
        enabled: true,
        createdAt: "",
        updatedAt: "",
      },
    ];

    expect(matchRoute("/any/path", routes)?.id).toBe("root");
  });

  it("prefers enabled shorter prefix when longer prefix is disabled", () => {
    const routes = [
      {
        id: "short",
        prefix: "/dav",
        stripPrefix: true,
        targetBaseUrl: "https://dav.example.com/root",
        customHeaders: [],
        enabled: true,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "long-disabled",
        prefix: "/dav/private",
        stripPrefix: false,
        targetBaseUrl: "https://dav.example.com/root",
        customHeaders: [],
        enabled: false,
        createdAt: "",
        updatedAt: "",
      },
    ];

    expect(matchRoute("/dav/private/file.txt", routes)?.id).toBe("short");
  });

  it("rewrites path when stripPrefix is true", () => {
    const route = {
      id: "1",
      prefix: "/dav",
      stripPrefix: true,
      targetBaseUrl: "https://dav.example.com/root",
      customHeaders: [],
      enabled: true,
      createdAt: "",
      updatedAt: "",
    };

    expect(
      buildTargetUrl(route, new URL("https://proxy.example.com/dav/private/file.txt")),
    ).toBe("https://dav.example.com/root/private/file.txt");
  });

  it("propagates query string to target URL", () => {
    const route = {
      id: "1",
      prefix: "/dav",
      stripPrefix: true,
      targetBaseUrl: "https://dav.example.com/root",
      customHeaders: [],
      enabled: true,
      createdAt: "",
      updatedAt: "",
    };

    expect(
      buildTargetUrl(
        route,
        new URL("https://proxy.example.com/dav/private/file.txt?download=1&name=a"),
      ),
    ).toBe("https://dav.example.com/root/private/file.txt?download=1&name=a");
  });
});
