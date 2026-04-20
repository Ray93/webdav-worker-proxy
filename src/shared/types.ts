export type BootstrapState = "uninitialized" | "ready";

export interface AppEnv {
  APP_KV: KVNamespace;
  ASSETS: Fetcher;
  ADMIN_SESSION_SECRET?: string;
}
