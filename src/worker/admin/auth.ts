import type { AppEnv } from "../../shared/types";
import { verifyPassword } from "../security/password";
import { signSession } from "../security/session";
import { KV_KEYS } from "../store/kv";

export async function handleLogin(env: AppEnv, request: Request): Promise<Response> {
  if (!env.ADMIN_SESSION_SECRET?.trim()) {
    return new Response(JSON.stringify({ error: "admin session secret missing" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }

  const { password } = (await request.json()) as { password: string };
  const passwordHash = await env.APP_KV.get(KV_KEYS.passwordHash);
  if (!passwordHash || !(await verifyPassword(password, passwordHash))) {
    return new Response(JSON.stringify({ error: "invalid credentials" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const token = await signSession(env.ADMIN_SESSION_SECRET);
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "content-type": "application/json",
      "set-cookie": `admin_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/`,
    },
  });
}

export function handleLogout(): Response {
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "content-type": "application/json",
      "set-cookie": "admin_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
    },
  });
}
