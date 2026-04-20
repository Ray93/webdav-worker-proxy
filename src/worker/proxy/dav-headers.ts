import type { ProxyRoute } from "../store/routes-store";
import { buildTargetUrl } from "./build-target-url";

interface DestinationInput {
  route: ProxyRoute;
  destination: string;
  proxyOrigin: string;
}

interface ResponseLocationInput {
  route: ProxyRoute;
  location: string;
  proxyOrigin: string;
}

function hasRoutePrefix(pathname: string, prefix: string): boolean {
  if (prefix === "/") return pathname.startsWith("/");
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function normalizeBasePath(pathname: string): string {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/$/, "");
}

function mapUpstreamPathToProxyPath(
  route: ProxyRoute,
  upstreamBasePath: string,
  locationPath: string,
): string | null {
  const normalizedBasePath = normalizeBasePath(upstreamBasePath);

  let relativePath: string;
  if (normalizedBasePath === "/") {
    relativePath = locationPath;
  } else if (
    locationPath === normalizedBasePath ||
    locationPath === `${normalizedBasePath}/`
  ) {
    relativePath = "/";
  } else if (locationPath.startsWith(`${normalizedBasePath}/`)) {
    relativePath = locationPath.slice(normalizedBasePath.length);
  } else {
    return null;
  }

  if (!route.stripPrefix) {
    if (!hasRoutePrefix(relativePath, route.prefix)) {
      return null;
    }
    return relativePath;
  }

  if (route.prefix === "/") return relativePath;
  if (relativePath === "/") return route.prefix;
  return `${route.prefix}${relativePath}`;
}

export function rewriteDestinationHeader(input: DestinationInput): string {
  let destinationUrl: URL;
  let proxyUrl: URL;
  try {
    destinationUrl = new URL(input.destination);
    proxyUrl = new URL(input.proxyOrigin);
  } catch {
    return input.destination;
  }

  if (destinationUrl.origin !== proxyUrl.origin) {
    return input.destination;
  }

  if (!hasRoutePrefix(destinationUrl.pathname, input.route.prefix)) {
    return input.destination;
  }
  const requestUrl = new URL(
    `https://placeholder${destinationUrl.pathname}${destinationUrl.search}`,
  );
  const rewritten = new URL(buildTargetUrl(input.route, requestUrl));
  rewritten.hash = destinationUrl.hash;
  return rewritten.toString();
}

export function rewriteResponseLocation(input: ResponseLocationInput): string {
  const upstream = new URL(input.route.targetBaseUrl);

  let locationUrl: URL;
  try {
    locationUrl = new URL(input.location);
  } catch {
    return input.location;
  }

  if (locationUrl.origin !== upstream.origin) return input.location;

  const rewrittenPath = mapUpstreamPathToProxyPath(
    input.route,
    upstream.pathname,
    locationUrl.pathname,
  );
  if (!rewrittenPath) return input.location;

  return `${input.proxyOrigin.replace(/\/$/, "")}${rewrittenPath}${locationUrl.search}${locationUrl.hash}`;
}
