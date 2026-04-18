import type { ProxyRoute } from "../store/routes-store";

export function matchRoute(pathname: string, routes: ProxyRoute[]): ProxyRoute | null {
  return (
    routes
      .filter((route) => route.enabled)
      .filter((route) =>
        route.prefix === "/"
          ? pathname.startsWith("/")
          : pathname === route.prefix || pathname.startsWith(`${route.prefix}/`),
      )
      .sort((left, right) => right.prefix.length - left.prefix.length)[0] ?? null
  );
}
