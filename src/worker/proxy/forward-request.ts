import type { AppEnv } from "../../shared/types";
import { listRoutes, type ProxyRoute } from "../store/routes-store";
import { buildTargetUrl } from "./build-target-url";
import {
  rewriteDestinationHeader,
  rewriteDavResponseHref,
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

function isDavMultistatusResponse(response: Response): boolean {
  if (response.status !== 207) return false;

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  return (
    contentType.includes("xml") ||
    contentType.includes("text/plain") ||
    contentType.includes("application/octet-stream")
  );
}

async function rewriteDavMultistatusBody(
  response: Response,
  route: ProxyRoute,
  requestUrl: URL,
): Promise<Response> {
  if (!isDavMultistatusResponse(response)) {
    return response;
  }

  const body = await response.text();
  if (!body.includes("<") || !body.toLowerCase().includes("href")) {
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  const rewrittenBody = body.replace(
    /(<(?:[A-Za-z0-9_-]+:)?href>)([^<]+)(<\/(?:[A-Za-z0-9_-]+:)?href>)/g,
    (_match, openTag: string, hrefValue: string, closeTag: string) =>
      `${openTag}${rewriteDavResponseHref({
        route,
        href: hrefValue,
        proxyOrigin: requestUrl.origin,
      })}${closeTag}`,
  );

  const headers = new Headers(response.headers);
  headers.delete("content-length");

  return new Response(rewrittenBody, {
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

  const upstreamResponse = await fetch(
    buildTargetUrl(route, requestUrl),
    buildProxyRequestInit(request, headers),
  );

  const responseWithRewrittenBody = await rewriteDavMultistatusBody(
    upstreamResponse,
    route,
    requestUrl,
  );

  return rewriteLocationHeader(responseWithRewrittenBody, route, requestUrl);
}
