import type { AppEnv } from "../../shared/types";
import { verifySession } from "../security/session";
import {
  listRoutes,
  saveRoutes,
  validateRouteInput,
  type ProxyRoute,
  type RouteInput,
} from "../store/routes-store";

function getCookieToken(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  return cookie.split("; ").find((part) => part.startsWith("admin_session="))?.split("=")[1] ?? null;
}

function errorResponse(status: number, error: string): Response {
  return Response.json({ error }, { status });
}

function routeInputError(error: unknown): Response {
  if (error instanceof Error && error.message === "prefix already exists") {
    return errorResponse(409, error.message);
  }

  if (error instanceof Error && error.message) {
    return errorResponse(400, error.message);
  }

  return errorResponse(400, "invalid route payload");
}

function isObjectBody(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function requireAdmin(request: Request, env: AppEnv): Promise<Response | null> {
  const token = getCookieToken(request);
  const secret = env.ADMIN_SESSION_SECRET?.trim();

  if (!secret || !token || !(await verifySession(token, secret))) {
    return errorResponse(401, "unauthorized");
  }

  return null;
}

export async function handleListRoutes(env: AppEnv): Promise<Response> {
  return Response.json(await listRoutes(env));
}

export async function handleCreateRoute(env: AppEnv, request: Request): Promise<Response> {
  let parsed: unknown;
  try {
    parsed = (await request.json()) as unknown;
  } catch {
    return errorResponse(400, "invalid json");
  }
  if (!isObjectBody(parsed)) {
    return errorResponse(400, "invalid route payload");
  }
  const input = parsed as unknown as RouteInput;

  const existing = await listRoutes(env);
  try {
    validateRouteInput(input, existing);
  } catch (error) {
    return routeInputError(error);
  }

  const now = new Date().toISOString();
  const route: ProxyRoute = { id: crypto.randomUUID(), ...input, createdAt: now, updatedAt: now };
  await saveRoutes(env, [...existing, route]);

  return Response.json(route, { status: 201 });
}

export async function handleToggleRoute(env: AppEnv, routeId: string): Promise<Response> {
  const routes = await listRoutes(env);
  const index = routes.findIndex((route) => route.id === routeId);
  if (index === -1) {
    return errorResponse(404, "route not found");
  }

  const current = routes[index];
  const toggled: ProxyRoute = {
    ...current,
    enabled: !current.enabled,
    updatedAt: new Date().toISOString(),
  };
  const next = [...routes];
  next[index] = toggled;

  await saveRoutes(env, next);

  return Response.json(toggled);
}

export async function handleUpdateRoute(env: AppEnv, routeId: string, request: Request): Promise<Response> {
  const routes = await listRoutes(env);
  const current = routes.find((route) => route.id === routeId);
  if (!current) {
    return errorResponse(404, "route not found");
  }

  let parsed: unknown;
  try {
    parsed = (await request.json()) as unknown;
  } catch {
    return errorResponse(400, "invalid json");
  }
  if (!isObjectBody(parsed)) {
    return errorResponse(400, "invalid route payload");
  }
  const input = parsed as unknown as RouteInput;

  try {
    validateRouteInput(input, routes, routeId);
  } catch (error) {
    return routeInputError(error);
  }

  const updated: ProxyRoute = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  await saveRoutes(
    env,
    routes.map((route) => (route.id === routeId ? updated : route)),
  );

  return Response.json(updated);
}

export async function handleDeleteRoute(env: AppEnv, routeId: string): Promise<Response> {
  const routes = await listRoutes(env);
  if (!routes.some((route) => route.id === routeId)) {
    return errorResponse(404, "route not found");
  }

  await saveRoutes(env, routes.filter((route) => route.id !== routeId));

  return new Response(null, { status: 204 });
}
