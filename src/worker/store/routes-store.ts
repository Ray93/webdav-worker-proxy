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
  if (typeof input.prefix !== "string") throw new Error("prefix must be a string");
  if (typeof input.stripPrefix !== "boolean") {
    throw new Error("stripPrefix must be a boolean");
  }
  if (typeof input.targetBaseUrl !== "string") {
    throw new Error("targetBaseUrl must be a string");
  }
  if (!Array.isArray(input.customHeaders)) {
    throw new Error("customHeaders must be an array");
  }
  if (typeof input.enabled !== "boolean") {
    throw new Error("enabled must be a boolean");
  }

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
  let url: URL;
  try {
    url = new URL(input.targetBaseUrl);
  } catch {
    throw new Error("targetBaseUrl must be an http or https URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("targetBaseUrl must be an http or https URL");
  }
  if (url.search || url.hash) {
    throw new Error("targetBaseUrl must not include query or hash");
  }
  for (const header of input.customHeaders) {
    if (typeof header !== "object" || header === null) {
      throw new Error("customHeaders entries must be objects");
    }
    if (typeof header.name !== "string" || typeof header.value !== "string") {
      throw new Error("customHeaders entries must have string name and value");
    }
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
