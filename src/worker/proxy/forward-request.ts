import type { AppEnv } from "../../shared/types";
import { listRoutes, type ProxyRoute } from "../store/routes-store";
import { buildTargetUrl } from "./build-target-url";
import {
  rewriteDestinationHeader,
  rewriteResponseLocation,
} from "./dav-headers";
import { matchRoute } from "./match-route";

function removeAdminCookie(headers: Headers): void {
  const cookie = headers.get("cookie");
  if (!cookie) return;

  const nextCookie = cookie
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part && !part.startsWith("admin_session="))
    .join("; ");

  if (nextCookie) {
    headers.set("cookie", nextCookie);
    return;
  }

  headers.delete("cookie");
}

function applyCustomHeaders(headers: Headers, route: ProxyRoute): void {
  for (const header of route.customHeaders) {
    headers.set(header.name, header.value);
  }
}

function buildProxyRequestInit(
  request: Request,
  headers: Headers,
): RequestInit {
  return {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual",
  };
}

function rewriteLocationHeader(
  response: Response,
  route: ProxyRoute,
  requestUrl: URL,
): Response {
  const location = response.headers.get("location");
  if (!location) return response;

  const headers = new Headers(response.headers);
  headers.set(
    "location",
    rewriteResponseLocation({
      route,
      location,
      proxyOrigin: requestUrl.origin,
    }),
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function maybeProxyRequest(
  request: Request,
  env: AppEnv,
): Promise<Response | null> {
  const requestUrl = new URL(request.url);
  const route = matchRoute(requestUrl.pathname, await listRoutes(env));
  if (!route) return null;

  const headers = new Headers(request.headers);
  removeAdminCookie(headers);
  applyCustomHeaders(headers, route);

  const destination = headers.get("destination");
  if (destination) {
    const rewritten = rewriteDestinationHeader({
      route,
      destination,
      proxyOrigin: requestUrl.origin,
    });

    if (rewritten.kind === "invalid") {
      return Response.json({ error: "invalid destination header" }, { status: 400 });
    }

    headers.set("destination", rewritten.value);
  }

  const response = await fetch(
    buildTargetUrl(route, requestUrl),
    buildProxyRequestInit(request, headers),
  );

  return rewriteLocationHeader(response, route, requestUrl);
}
