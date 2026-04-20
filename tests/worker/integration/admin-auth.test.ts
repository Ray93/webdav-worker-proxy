// @ts-expect-error provided by @cloudflare/vitest-pool-workers at test runtime
import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import type { AppEnv } from "../../../src/shared/types";
import { handleBootstrap, handleSetup } from "../../../src/worker/admin/bootstrap";
import { handleLogin } from "../../../src/worker/admin/auth";
import { routeRequest } from "../../../src/worker/router";
import { signSession } from "../../../src/worker/security/session";
import { KV_KEYS } from "../../../src/worker/store/kv";

describe("admin bootstrap and auth", () => {
  it("follows bootstrap flow when runtime secret is configured", async () => {
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
    expect(login.status).toBe(200);
    expect(login.headers.get("set-cookie")).toContain("admin_session=");

    const secondSetup = await SELF.fetch("https://example.com/api/admin/setup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "other-pass" }),
    });
    expect(secondSetup.status).toBe(409);
    expect(await secondSetup.json()).toMatchObject({ error: "already initialized" });
  });

  it("blocks login and admin access when runtime secret is missing", async () => {
    const noSecretEnv = {
      ADMIN_SESSION_SECRET: "  ",
      APP_KV: {
        get: async () => null,
      },
      ASSETS: { fetch: async () => new Response("asset") },
    } as unknown as AppEnv;

    const login = await handleLogin(
      noSecretEnv,
      new Request("https://example.com/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: "secret-pass" }),
      }),
    );
    expect(login.status).toBe(503);
    expect(await login.json()).toMatchObject({ error: "admin session secret missing" });

    const token = await signSession("");
    const response = await routeRequest(
      new Request("https://example.com/api/admin/routes", {
        method: "GET",
        headers: { cookie: `admin_session=${token}` },
      }),
      noSecretEnv,
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: "unauthorized" });
  });

  it("returns to uninitialized state and allows setup again when runtime secret is missing", async () => {
    let storedPasswordHash = "existing-password-hash";
    const noSecretEnv = {
      ADMIN_SESSION_SECRET: "  ",
      APP_KV: {
        get: async (key: string) =>
          key === KV_KEYS.passwordHash ? storedPasswordHash : null,
        put: async (key: string, value: string) => {
          if (key === KV_KEYS.passwordHash) {
            storedPasswordHash = value;
          }
        },
      },
      ASSETS: { fetch: async () => new Response("asset") },
    } as unknown as AppEnv;

    const bootstrap = await handleBootstrap(noSecretEnv);
    expect(await bootstrap.json()).toMatchObject({ state: "uninitialized" });

    const setup = await handleSetup(
      noSecretEnv,
      new Request("https://example.com/api/admin/setup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: "new-secret-pass" }),
      }),
    );

    expect(setup.status).toBe(200);
    expect(await setup.json()).toMatchObject({ secretName: "ADMIN_SESSION_SECRET" });
    expect(storedPasswordHash).not.toBe("existing-password-hash");
  });
});
