import { ADMIN_UI_PREFIX } from "../shared/constants";
import type { AppEnv } from "../shared/types";
import { handleLogin, handleLogout } from "./admin/auth";
import { handleBootstrap, handleSetup } from "./admin/bootstrap";
import {
  handleCreateRoute,
  handleDeleteRoute,
  handleListRoutes,
  handleToggleRoute,
  handleUpdateRoute,
  requireAdmin,
} from "./admin/routes";

export async function routeRequest(request: Request, env: AppEnv): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === ADMIN_UI_PREFIX || url.pathname.startsWith(`${ADMIN_UI_PREFIX}/`)) {
    return env.ASSETS.fetch(request);
  }

  if (url.pathname === "/api/admin/bootstrap" && request.method === "GET") {
    return handleBootstrap(env);
  }

  if (url.pathname === "/api/admin/setup" && request.method === "POST") {
    return handleSetup(env, request);
  }

  if (url.pathname === "/api/admin/login" && request.method === "POST") {
    return handleLogin(env, request);
  }

  if (url.pathname === "/api/admin/logout" && request.method === "POST") {
    return handleLogout();
  }

  if (url.pathname.startsWith("/api/admin/routes")) {
    const unauthorized = await requireAdmin(request, env);
    if (unauthorized) return unauthorized;

    if (url.pathname === "/api/admin/routes" && request.method === "GET") {
      return handleListRoutes(env);
    }
    if (url.pathname === "/api/admin/routes" && request.method === "POST") {
      return handleCreateRoute(env, request);
    }
    if (/^\/api\/admin\/routes\/[^/]+$/.test(url.pathname) && request.method === "PUT") {
      return handleUpdateRoute(env, url.pathname.split("/")[4], request);
    }
    if (url.pathname.endsWith("/toggle") && request.method === "PATCH") {
      return handleToggleRoute(env, url.pathname.split("/")[4]);
    }
    if (/^\/api\/admin\/routes\/[^/]+$/.test(url.pathname) && request.method === "DELETE") {
      return handleDeleteRoute(env, url.pathname.split("/")[4]);
    }
  }

  return new Response("Not found", { status: 404 });
}
