import { RESERVED_PREFIXES } from "../../shared/constants";
import type { AppEnv } from "../../shared/types";
import { getJson, KV_KEYS, putJson } from "./kv";

export interface RouteHeader {
  name: string;
  value: string;
}

export interface ProxyRoute {
  id: string;
  prefix: string;
  stripPrefix: boolean;
  targetBaseUrl: string;
  customHeaders: RouteHeader[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RouteInput {
  prefix: string;
  stripPrefix: boolean;
  targetBaseUrl: string;
  customHeaders: RouteHeader[];
  enabled: boolean;
}

export function validateRouteInput(
  input: RouteInput,
  existing: ProxyRoute[],
  currentId?: string,
): void {
  if (!input.prefix.startsWith("/")) throw new Error("prefix must start with /");
  if (input.prefix !== "/" && input.prefix.endsWith("/")) {
    throw new Error("prefix must not end with /");
  }
  if (
    RESERVED_PREFIXES.some(
      (prefix) =>
        input.prefix === prefix || input.prefix.startsWith(`${prefix}/`),
    )
  ) {
    throw new Error("prefix is reserved");
  }
  try {
    const url = new URL(input.targetBaseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("targetBaseUrl must be an http or https URL");
    }
  } catch {
    throw new Error("targetBaseUrl must be an http or https URL");
  }
  if (existing.some((route) => route.prefix === input.prefix && route.id !== currentId)) {
    throw new Error("prefix already exists");
  }
}

export async function listRoutes(env: AppEnv): Promise<ProxyRoute[]> {
  return getJson<ProxyRoute[]>(env, KV_KEYS.routes, []);
}

export async function saveRoutes(env: AppEnv, routes: ProxyRoute[]): Promise<void> {
  await putJson(env, KV_KEYS.routes, routes);
}
