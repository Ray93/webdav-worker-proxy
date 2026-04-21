import type { ProxyRoute } from "../store/routes-store";
import { buildTargetUrl } from "./build-target-url";

interface DestinationInput {
  route: ProxyRoute;
  destination: string;
  proxyOrigin: string;
}
type DestinationRewriteResult =
  | { kind: "rewritten"; value: string }
  | { kind: "passthrough"; value: string }
  | { kind: "invalid"; value: string };

interface ResponseLocationInput {
  route: ProxyRoute;
  location: string;
  proxyOrigin: string;
}

interface DavHrefInput {
  route: ProxyRoute;
  href: string;
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

function mapHrefPath(route: ProxyRoute, hrefPath: string): string | null {
  const upstream = new URL(route.targetBaseUrl);
  return mapUpstreamPathToProxyPath(route, upstream.pathname, hrefPath);
}

export function rewriteDestinationHeader(
  input: DestinationInput,
): DestinationRewriteResult {
  let proxyUrl: URL;
  try {
    proxyUrl = new URL(input.proxyOrigin);
  } catch {
    return { kind: "passthrough", value: input.destination };
  }

  let destinationUrl: URL;
  try {
    destinationUrl = new URL(input.destination);
  } catch {
    if (!input.destination.startsWith("/")) {
      return { kind: "passthrough", value: input.destination };
    }
    try {
      destinationUrl = new URL(input.destination, proxyUrl.origin);
    } catch {
      return { kind: "passthrough", value: input.destination };
    }
  }

  if (destinationUrl.origin !== proxyUrl.origin) {
    return { kind: "passthrough", value: input.destination };
  }

  if (!hasRoutePrefix(destinationUrl.pathname, input.route.prefix)) {
    return { kind: "invalid", value: input.destination };
  }
  const requestUrl = new URL(
    `https://placeholder${destinationUrl.pathname}${destinationUrl.search}`,
  );
  const rewritten = new URL(buildTargetUrl(input.route, requestUrl));
  rewritten.hash = destinationUrl.hash;
  return { kind: "rewritten", value: rewritten.toString() };
}

export function rewriteResponseLocation(input: ResponseLocationInput): string {
  const upstream = new URL(input.route.targetBaseUrl);

  let locationUrl: URL;
  try {
    locationUrl = new URL(input.location);
  } catch {
    if (!input.location.startsWith("/")) return input.location;
    try {
      locationUrl = new URL(input.location, upstream.origin);
    } catch {
      return input.location;
    }
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

export function rewriteDavResponseHref(input: DavHrefInput): string {
  let hrefUrl: URL;
  try {
    hrefUrl = new URL(input.href);
  } catch {
    if (!input.href.startsWith("/")) {
      return input.href;
    }

    const rewrittenPath = mapHrefPath(input.route, input.href);
    return rewrittenPath ?? input.href;
  }

  const upstream = new URL(input.route.targetBaseUrl);
  if (hrefUrl.origin !== upstream.origin) {
    return input.href;
  }

  const rewrittenPath = mapHrefPath(input.route, hrefUrl.pathname);
  if (!rewrittenPath) {
    return input.href;
  }

  return `${input.proxyOrigin.replace(/\/$/, "")}${rewrittenPath}${hrefUrl.search}${hrefUrl.hash}`;
}
