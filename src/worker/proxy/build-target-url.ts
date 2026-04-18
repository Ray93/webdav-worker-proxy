import type { ProxyRoute } from "../store/routes-store";

export function buildTargetUrl(route: ProxyRoute, requestUrl: URL): string {
  const upstream = new URL(route.targetBaseUrl);
  const nextPath = route.stripPrefix
    ? requestUrl.pathname.slice(route.prefix.length) || "/"
    : requestUrl.pathname;
  upstream.pathname = `${upstream.pathname.replace(/\/$/, "")}/${nextPath.replace(/^\//, "")}`;
  upstream.search = requestUrl.search;
  return upstream.toString();
}
