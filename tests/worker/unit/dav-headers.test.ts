import { describe, expect, it } from "vitest";
import {
  rewriteDestinationHeader,
  rewriteResponseLocation,
} from "../../../src/worker/proxy/dav-headers";

const davRoute = {
  id: "1",
  prefix: "/dav",
  stripPrefix: true,
  targetBaseUrl: "https://dav.example.com/root",
  customHeaders: [],
  enabled: true,
  createdAt: "",
  updatedAt: "",
};
const proxyOrigin = "https://proxy.example.com";

describe("rewriteDestinationHeader", () => {
  it("rewrites proxy-domain destinations to the upstream URL", () => {
    expect(
      rewriteDestinationHeader({
        route: davRoute,
        proxyOrigin,
        destination: "https://proxy.example.com/dav/folder/file.txt",
      }),
    ).toBe("https://dav.example.com/root/folder/file.txt");
  });

  it("keeps non-matching destinations unchanged", () => {
    expect(
      rewriteDestinationHeader({
        route: davRoute,
        proxyOrigin,
        destination: "https://proxy.example.com/other/folder/file.txt",
      }),
    ).toBe("https://proxy.example.com/other/folder/file.txt");
  });

  it("returns cross-origin destinations unchanged", () => {
    expect(
      rewriteDestinationHeader({
        route: davRoute,
        proxyOrigin,
        destination: "https://another-proxy.example.com/dav/folder/file.txt",
      }),
    ).toBe("https://another-proxy.example.com/dav/folder/file.txt");
  });

  it("returns malformed destinations unchanged without throwing", () => {
    expect(() =>
      rewriteDestinationHeader({
        route: davRoute,
        proxyOrigin,
        destination: "not a url",
      }),
    ).not.toThrow();

    expect(
      rewriteDestinationHeader({
        route: davRoute,
        proxyOrigin,
        destination: "not a url",
      }),
    ).toBe("not a url");
  });

  it("preserves hash in rewritten destination", () => {
    expect(
      rewriteDestinationHeader({
        route: davRoute,
        proxyOrigin,
        destination: "https://proxy.example.com/dav/folder/file.txt?download=1#part",
      }),
    ).toBe("https://dav.example.com/root/folder/file.txt?download=1#part");
  });
});

describe("rewriteResponseLocation", () => {
  it("rewrites same-origin upstream locations to the proxy route path", () => {
    expect(
      rewriteResponseLocation({
        route: davRoute,
        location: "https://dav.example.com/root/folder/file.txt?download=1",
        proxyOrigin: "https://proxy.example.com",
      }),
    ).toBe("https://proxy.example.com/dav/folder/file.txt?download=1");
  });

  it("returns original location when origin does not match upstream", () => {
    expect(
      rewriteResponseLocation({
        route: davRoute,
        location: "https://other.example.com/root/folder/file.txt",
        proxyOrigin: "https://proxy.example.com",
      }),
    ).toBe("https://other.example.com/root/folder/file.txt");
  });

  it("returns relative locations unchanged without throwing", () => {
    expect(() =>
      rewriteResponseLocation({
        route: davRoute,
        location: "/root/folder/file.txt",
        proxyOrigin: "https://proxy.example.com",
      }),
    ).not.toThrow();

    expect(
      rewriteResponseLocation({
        route: davRoute,
        location: "/root/folder/file.txt",
        proxyOrigin: "https://proxy.example.com",
      }),
    ).toBe("/root/folder/file.txt");
  });

  it("handles root prefix without introducing double slashes", () => {
    expect(
      rewriteResponseLocation({
        route: {
          ...davRoute,
          prefix: "/",
        },
        location: "https://dav.example.com/root/folder/file.txt",
        proxyOrigin: "https://proxy.example.com",
      }),
    ).toBe("https://proxy.example.com/folder/file.txt");
  });

  it("preserves hash in rewritten response location", () => {
    expect(
      rewriteResponseLocation({
        route: davRoute,
        location: "https://dav.example.com/root/folder/file.txt?download=1#part",
        proxyOrigin,
      }),
    ).toBe("https://proxy.example.com/dav/folder/file.txt?download=1#part");
  });
});
