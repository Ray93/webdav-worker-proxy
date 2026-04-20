import { describe, expect, it } from "vitest";
import { rewriteDestinationHeader } from "../../../src/worker/proxy/dav-headers";

describe("rewriteDestinationHeader", () => {
  it("rewrites proxy-domain destinations to the upstream URL", () => {
    expect(
      rewriteDestinationHeader({
        route: {
          id: "1",
          prefix: "/dav",
          stripPrefix: true,
          targetBaseUrl: "https://dav.example.com/root",
          customHeaders: [],
          enabled: true,
          createdAt: "",
          updatedAt: "",
        },
        destination: "https://proxy.example.com/dav/folder/file.txt",
      }),
    ).toBe("https://dav.example.com/root/folder/file.txt");
  });
});
