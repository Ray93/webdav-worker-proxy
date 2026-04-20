import { ADMIN_UI_PREFIX } from "../shared/constants";
import type { AppEnv } from "../shared/types";
import { handleLogin, handleLogout } from "./admin/auth";
import { handleBootstrap, handleSetup } from "./admin/bootstrap";

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

  return new Response("Not found", { status: 404 });
}
