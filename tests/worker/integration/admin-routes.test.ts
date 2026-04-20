import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { signSession } from "../../../src/worker/security/session";

describe("admin route api", () => {
  it("creates, updates, toggles, and deletes a route", async () => {
    await SELF.fetch("https://example.com/api/admin/setup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "secret-pass" }),
    });

    const login = await SELF.fetch("https://example.com/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "secret-pass" }),
    });

    const cookie = login.headers.get("set-cookie") ?? `admin_session=${await signSession("")}`;

    const create = await SELF.fetch("https://example.com/api/admin/routes", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({
        prefix: "/dav",
        stripPrefix: true,
        targetBaseUrl: "https://dav.example.com/root",
        customHeaders: [{ name: "x-upstream-token", value: "abc" }],
        enabled: true,
      }),
    });

    const created = await create.json();
    expect(created.prefix).toBe("/dav");

    const updated = await SELF.fetch(`https://example.com/api/admin/routes/${created.id}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({
        prefix: "/dav",
        stripPrefix: false,
        targetBaseUrl: "https://dav.example.com/root/v2",
        customHeaders: [{ name: "x-upstream-token", value: "xyz" }],
        enabled: true,
      }),
    });
    expect((await updated.json()).targetBaseUrl).toBe("https://dav.example.com/root/v2");

    const toggled = await SELF.fetch(`https://example.com/api/admin/routes/${created.id}/toggle`, {
      method: "PATCH",
      headers: { cookie },
    });
    expect((await toggled.json()).enabled).toBe(false);

    const deleted = await SELF.fetch(`https://example.com/api/admin/routes/${created.id}`, {
      method: "DELETE",
      headers: { cookie },
    });
    expect(deleted.status).toBe(204);
  });
});
