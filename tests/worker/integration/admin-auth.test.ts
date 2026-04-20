import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("admin bootstrap and auth", () => {
  it("returns uninitialized before setup and sets a session cookie after login", async () => {
    const before = await SELF.fetch("https://example.com/api/admin/bootstrap");
    expect(await before.json()).toMatchObject({ state: "uninitialized" });

    const setup = await SELF.fetch("https://example.com/api/admin/setup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "secret-pass" }),
    });
    expect(await setup.json()).toMatchObject({ secretName: "ADMIN_SESSION_SECRET" });

    const login = await SELF.fetch("https://example.com/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "secret-pass" }),
    });
    expect(login.headers.get("set-cookie")).toContain("admin_session=");
  });
});
