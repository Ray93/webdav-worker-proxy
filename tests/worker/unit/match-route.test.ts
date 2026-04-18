import { describe, expect, it } from "vitest";
import { matchRoute } from "../../../src/worker/proxy/match-route";
import { buildTargetUrl } from "../../../src/worker/proxy/build-target-url";

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

describe("proxy route matching", () => {
  it("uses the longest enabled prefix and builds the target URL correctly", () => {
    const matched = matchRoute("/dav/private/file.txt", routes);
    expect(matched?.id).toBe("2");
    expect(
      buildTargetUrl(
        matched!,
        new URL("https://proxy.example.com/dav/private/file.txt"),
      ),
    ).toBe("https://dav.example.com/root/dav/private/file.txt");
  });
});
