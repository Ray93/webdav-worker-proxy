import { RESERVED_PREFIXES } from "../../shared/constants";
import type { AppEnv } from "../../shared/types";
import { getJson, KV_KEYS, putJson } from "./kv";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);
const HEADER_NAME_PATTERN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const INVALID_HEADER_VALUE_PATTERN = /[\u0000-\u001f\u007f]/;

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
  if (input.prefix.includes("?") || input.prefix.includes("#")) {
    throw new Error("prefix must be a stable pathname");
  }
  const canonicalPrefix = new URL(input.prefix, "https://example.invalid").pathname;
  if (canonicalPrefix !== input.prefix) {
    throw new Error("prefix must be a stable pathname");
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
  for (const header of input.customHeaders) {
    const trimmedName = header.name.trim();
    if (!trimmedName) {
      throw new Error("header name is required");
    }
    if (header.name !== trimmedName) {
      throw new Error("header name must not contain surrounding whitespace");
    }
    if (!HEADER_NAME_PATTERN.test(header.name)) {
      throw new Error("header name is invalid");
    }
    if (HOP_BY_HOP_HEADERS.has(header.name.toLowerCase())) {
      throw new Error("header name is forbidden");
    }
    if (INVALID_HEADER_VALUE_PATTERN.test(header.value)) {
      throw new Error("header value is invalid");
    }
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
