import type { ProxyRoute } from "../store/routes-store";
import { buildTargetUrl } from "./build-target-url";

interface DestinationInput {
  route: ProxyRoute;
  destination: string;
}

export function rewriteDestinationHeader(input: DestinationInput): string {
  const destinationUrl = new URL(input.destination);
  const requestUrl = new URL(
    `https://placeholder${destinationUrl.pathname}${destinationUrl.search}`,
  );
  return buildTargetUrl(input.route, requestUrl);
}

export function rewriteResponseLocation(
  location: string,
  upstream: URL,
  proxyOrigin: string,
  prefix: string,
): string {
  const locationUrl = new URL(location);
  if (locationUrl.origin !== upstream.origin) return location;
  return `${proxyOrigin}${prefix}${locationUrl.pathname}${locationUrl.search}`;
}
