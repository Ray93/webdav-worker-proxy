import { describe, expect, it } from "vitest";
import { validateRouteInput } from "../../../src/worker/store/routes-store";

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
});
