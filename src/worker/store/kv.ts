import type { AppEnv } from "../../shared/types";

export const KV_KEYS = {
  passwordHash: "admin.passwordHash",
  routes: "proxy.routes",
} as const;

export async function getJson<T>(
  env: AppEnv,
  key: string,
  fallback: T,
): Promise<T> {
  const raw = await env.APP_KV.get(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
}

export async function putText(
  env: AppEnv,
  key: string,
  value: string,
): Promise<void> {
  await env.APP_KV.put(key, value);
}

export async function putJson(
  env: AppEnv,
  key: string,
  value: unknown,
): Promise<void> {
  await env.APP_KV.put(key, JSON.stringify(value));
}
