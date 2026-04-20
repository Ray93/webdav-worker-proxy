// @ts-expect-error provided by @cloudflare/vitest-pool-workers at test runtime
import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

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
    expect(login.status).toBe(200);

    const cookie = login.headers.get("set-cookie")!;

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

    const listed = await SELF.fetch("https://example.com/api/admin/routes", {
      method: "GET",
      headers: { cookie },
    });
    expect(listed.status).toBe(200);
    expect(await listed.json()).toMatchObject([{ id: created.id, prefix: "/dav" }]);

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

  it("returns stable 4xx errors for malformed payloads and missing routes", async () => {
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
    expect(login.status).toBe(200);

    const cookie = login.headers.get("set-cookie")!;

    const malformed = await SELF.fetch("https://example.com/api/admin/routes", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: "{invalid",
    });
    expect(malformed.status).toBe(400);

    const nonObjectCreate = await SELF.fetch("https://example.com/api/admin/routes", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify(123),
    });
    expect(nonObjectCreate.status).toBe(400);
    expect(await nonObjectCreate.json()).toMatchObject({ error: "invalid route payload" });

    const created = await SELF.fetch("https://example.com/api/admin/routes", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({
        prefix: "/dup",
        stripPrefix: true,
        targetBaseUrl: "https://dav.example.com/root",
        customHeaders: [{ name: "x-upstream-token", value: "abc" }],
        enabled: true,
      }),
    });
    expect(created.status).toBe(201);

    const duplicate = await SELF.fetch("https://example.com/api/admin/routes", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({
        prefix: "/dup",
        stripPrefix: true,
        targetBaseUrl: "https://dav.example.com/root2",
        customHeaders: [{ name: "x-upstream-token", value: "abc" }],
        enabled: true,
      }),
    });
    expect(duplicate.status).toBe(409);

    const nonObjectUpdate = await SELF.fetch(`https://example.com/api/admin/routes/${(await created.json()).id}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify(["bad"]),
    });
    expect(nonObjectUpdate.status).toBe(400);
    expect(await nonObjectUpdate.json()).toMatchObject({ error: "invalid route payload" });

    const missingToggle = await SELF.fetch("https://example.com/api/admin/routes/missing-id/toggle", {
      method: "PATCH",
      headers: { cookie },
    });
    expect(missingToggle.status).toBe(404);

    const missingDelete = await SELF.fetch("https://example.com/api/admin/routes/missing-id", {
      method: "DELETE",
      headers: { cookie },
    });
    expect(missingDelete.status).toBe(404);
  });
});
