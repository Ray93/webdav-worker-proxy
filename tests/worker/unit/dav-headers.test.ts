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

describe("rewriteDestinationHeader", () => {
  it("rewrites proxy-domain destinations to the upstream URL", () => {
    expect(
      rewriteDestinationHeader({
        route: davRoute,
        destination: "https://proxy.example.com/dav/folder/file.txt",
      }),
    ).toBe("https://dav.example.com/root/folder/file.txt");
  });

  it("keeps non-matching destinations unchanged", () => {
    expect(
      rewriteDestinationHeader({
        route: davRoute,
        destination: "https://proxy.example.com/other/folder/file.txt",
      }),
    ).toBe("https://proxy.example.com/other/folder/file.txt");
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
});
