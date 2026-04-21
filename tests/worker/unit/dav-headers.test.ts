import { describe, expect, it } from "vitest";
import {
  rewriteDestinationHeader,
  rewriteDavResponseHref,
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
const davRouteNoStrip = {
  ...davRoute,
  stripPrefix: false,
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
    ).toEqual({
      kind: "rewritten",
      value: "https://dav.example.com/root/folder/file.txt",
    });
  });

  it("returns same-origin non-matching destinations as invalid", () => {
    expect(
      rewriteDestinationHeader({
        route: davRoute,
        proxyOrigin,
        destination: "https://proxy.example.com/other/folder/file.txt",
      }),
    ).toEqual({
      kind: "invalid",
      value: "https://proxy.example.com/other/folder/file.txt",
    });
  });

  it("returns cross-origin destinations as passthrough", () => {
    expect(
      rewriteDestinationHeader({
        route: davRoute,
        proxyOrigin,
        destination: "https://another-proxy.example.com/dav/folder/file.txt",
      }),
    ).toEqual({
      kind: "passthrough",
      value: "https://another-proxy.example.com/dav/folder/file.txt",
    });
  });

  it("returns malformed destinations as passthrough without throwing", () => {
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
    ).toEqual({
      kind: "passthrough",
      value: "not a url",
    });
  });

  it("preserves hash in rewritten destination", () => {
    expect(
      rewriteDestinationHeader({
        route: davRoute,
        proxyOrigin,
        destination: "https://proxy.example.com/dav/folder/file.txt?download=1#part",
      }),
    ).toEqual({
      kind: "rewritten",
      value: "https://dav.example.com/root/folder/file.txt?download=1#part",
    });
  });
  it("rewrites root-relative destinations and preserves query/hash", () => {
    expect(
      rewriteDestinationHeader({
        route: davRoute,
        proxyOrigin,
        destination: "/dav/folder/file.txt?download=1#part",
      }),
    ).toEqual({
      kind: "rewritten",
      value: "https://dav.example.com/root/folder/file.txt?download=1#part",
    });
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

  it("rewrites root-relative upstream locations when they map to the route subtree", () => {
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
    ).toBe("https://proxy.example.com/dav/folder/file.txt");
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

  it("rewrites stripPrefix=false locations inside mapped subtree", () => {
    expect(
      rewriteResponseLocation({
        route: davRouteNoStrip,
        location: "https://dav.example.com/root/dav/file.txt",
        proxyOrigin,
      }),
    ).toBe("https://proxy.example.com/dav/file.txt");
  });

  it("keeps stripPrefix=false locations outside mapped subtree unchanged", () => {
    expect(
      rewriteResponseLocation({
        route: davRouteNoStrip,
        location: "https://dav.example.com/root/other",
        proxyOrigin,
      }),
    ).toBe("https://dav.example.com/root/other");
  });
});

describe("rewriteDavResponseHref", () => {
  it("rewrites root-relative upstream href values to proxy-relative paths", () => {
    expect(
      rewriteDavResponseHref({
        route: {
          ...davRoute,
          prefix: "/",
          targetBaseUrl: "https://dav.example.com/dav",
        },
        href: "/dav/Koofr/nodewarden/file.zip",
        proxyOrigin,
      }),
    ).toBe("/Koofr/nodewarden/file.zip");
  });

  it("rewrites absolute upstream href values to proxy absolute URLs", () => {
    expect(
      rewriteDavResponseHref({
        route: {
          ...davRoute,
          prefix: "/",
          targetBaseUrl: "https://dav.example.com/dav",
        },
        href: "https://dav.example.com/dav/Koofr/nodewarden/file.zip",
        proxyOrigin,
      }),
    ).toBe("https://proxy.example.com/Koofr/nodewarden/file.zip");
  });

  it("keeps non-matching href values unchanged", () => {
    expect(
      rewriteDavResponseHref({
        route: {
          ...davRoute,
          prefix: "/",
          targetBaseUrl: "https://dav.example.com/dav",
        },
        href: "/other/file.zip",
        proxyOrigin,
      }),
    ).toBe("/other/file.zip");
  });
});
