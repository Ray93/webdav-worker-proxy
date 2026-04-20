// @ts-expect-error provided by @cloudflare/vitest-pool-workers at test runtime
import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("admin bootstrap and auth", () => {
  it("follows bootstrap flow and enforces secret requirements", async () => {
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
    expect(login.status).toBe(503);
    expect(await login.json()).toMatchObject({ error: "admin session secret missing" });

    const secondSetup = await SELF.fetch("https://example.com/api/admin/setup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "other-pass" }),
    });
    expect(secondSetup.status).toBe(409);
    expect(await secondSetup.json()).toMatchObject({ error: "already initialized" });
  });
});
