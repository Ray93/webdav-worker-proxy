import type { BootstrapState } from "../../shared/types";
import type {
  ProxyRoute,
  RouteInput,
} from "../../worker/store/routes-store";

export interface BootstrapResponse {
  state: BootstrapState;
  hasRuntimeSecret: boolean;
  secretName: string;
}

export interface SetupResponse {
  secretName: string;
  generatedSecret: string;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? ((await response.json()) as Record<string, unknown>) : null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      typeof payload?.error === "string" ? payload.error : "请求失败",
    );
  }

  return payload as T;
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "same-origin",
    ...init,
  });

  return parseResponse<T>(response);
}

export async function fetchBootstrap(): Promise<BootstrapResponse> {
  return request<BootstrapResponse>("/api/admin/bootstrap");
}

export async function setupPassword(password: string): Promise<SetupResponse> {
  return request<SetupResponse>("/api/admin/setup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password }),
  });
}

export async function login(password: string): Promise<void> {
  await request<{ ok: true }>("/api/admin/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password }),
  });
}

export async function logout(): Promise<void> {
  await request<{ ok: true }>("/api/admin/logout", {
    method: "POST",
  });
}

export async function listRoutes(): Promise<ProxyRoute[]> {
  return request<ProxyRoute[]>("/api/admin/routes");
}

export async function createRoute(input: RouteInput): Promise<ProxyRoute> {
  return request<ProxyRoute>("/api/admin/routes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateRoute(
  routeId: string,
  input: RouteInput,
): Promise<ProxyRoute> {
  return request<ProxyRoute>(`/api/admin/routes/${routeId}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function toggleRoute(routeId: string): Promise<ProxyRoute> {
  return request<ProxyRoute>(`/api/admin/routes/${routeId}/toggle`, {
    method: "PATCH",
  });
}

export async function deleteRoute(routeId: string): Promise<void> {
  await fetch(`/api/admin/routes/${routeId}`, {
    method: "DELETE",
    credentials: "same-origin",
  }).then(async (response) => {
    if (!response.ok) {
      const payload = response.headers
        .get("content-type")
        ?.includes("application/json")
        ? ((await response.json()) as Record<string, unknown>)
        : null;
      throw new ApiError(
        response.status,
        typeof payload?.error === "string" ? payload.error : "请求失败",
      );
    }
  });
}

export type { ProxyRoute, RouteInput };
