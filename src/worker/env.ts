import type { AppEnv } from "../shared/types";

export function hasRuntimeSecret(env: AppEnv): boolean {
  return Boolean(env.ADMIN_SESSION_SECRET && env.ADMIN_SESSION_SECRET.trim());
}
