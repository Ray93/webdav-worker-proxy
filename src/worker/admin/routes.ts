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

export async function requireAdmin(request: Request, env: AppEnv): Promise<Response | null> {
  const token = getCookieToken(request);
  const secret = env.ADMIN_SESSION_SECRET ?? "";

  if (!token || !(await verifySession(token, secret))) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  return null;
}

export async function handleListRoutes(env: AppEnv): Promise<Response> {
  return Response.json(await listRoutes(env));
}

export async function handleCreateRoute(env: AppEnv, request: Request): Promise<Response> {
  const input = (await request.json()) as RouteInput;
  const existing = await listRoutes(env);
  validateRouteInput(input, existing);

  const now = new Date().toISOString();
  const route: ProxyRoute = { id: crypto.randomUUID(), ...input, createdAt: now, updatedAt: now };
  await saveRoutes(env, [...existing, route]);

  return Response.json(route, { status: 201 });
}

export async function handleToggleRoute(env: AppEnv, routeId: string): Promise<Response> {
  const routes = await listRoutes(env);
  const next = routes.map((route) =>
    route.id === routeId ? { ...route, enabled: !route.enabled, updatedAt: new Date().toISOString() } : route,
  );
  const toggled = next.find((route) => route.id === routeId);

  await saveRoutes(env, next);

  return Response.json(toggled);
}

export async function handleUpdateRoute(env: AppEnv, routeId: string, request: Request): Promise<Response> {
  const input = (await request.json()) as RouteInput;
  const routes = await listRoutes(env);
  validateRouteInput(input, routes, routeId);

  const current = routes.find((route) => route.id === routeId);
  if (!current) {
    return new Response(JSON.stringify({ error: "route not found" }), { status: 404 });
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
  await saveRoutes(env, routes.filter((route) => route.id !== routeId));

  return new Response(null, { status: 204 });
}
